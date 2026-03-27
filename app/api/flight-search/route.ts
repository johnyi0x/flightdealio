import { NextRequest, NextResponse } from "next/server";
import { getClientIpForTravelpayouts, getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { searchFlightsWithTravelpayouts } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";

type Cabin = "economy" | "premium_economy" | "business" | "first";

function resolveRequestHost(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("host") || "localhost";
}

/**
 * Travelpayouts-only: listed fares match partner booking URLs (click API per row).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const flightCap = rateLimitMax("RATE_LIMIT_FLIGHT_SEARCH_PER_MIN", 30);
    if (!allowRateLimit("flight-search", ip, flightCap)) {
      return NextResponse.json(
        { ok: false, error: "Too many searches. Please wait a minute and try again." },
        { status: 429 },
      );
    }

    const tpToken = process.env.TRAVELPAYOUTS_API_TOKEN?.trim();
    const marker = (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "").trim();

    if (!tpToken || !marker) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Flight search is not configured. Add TRAVELPAYOUTS_API_TOKEN and NEXT_PUBLIC_TRAVELPAYOUTS_MARKER in your host settings.",
        },
        { status: 503 },
      );
    }

    const userIp = getClientIpForTravelpayouts(req);
    if (!userIp) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not detect your network location for this search. Try another network or contact support.",
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseFlightBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const capEnv = Number(process.env.FLIGHT_RESULTS_CAP);
    const limit = Number.isFinite(capEnv) && capEnv > 0 ? Math.min(capEnv, 120) : 80;
    const offers = await searchFlightsWithTravelpayouts({
      apiToken: tpToken,
      marker,
      host: resolveRequestHost(req),
      userIp,
      origin: parsed.value.origin,
      destination: parsed.value.destination,
      departureDate: parsed.value.departureDate,
      returnDate: parsed.value.returnDate,
      directOnly: parsed.value.directOnly,
      cabinClass: parsed.value.cabinClass,
      limit,
    });

    if (offers.length === 0) {
      return NextResponse.json({
        ok: true,
        offers: [],
        source: "travelpayouts",
        emptyHint:
          "No partner fares returned for this search. Try other dates, nearby airports, or allow connections.",
      });
    }

    return NextResponse.json({ ok: true, offers, source: "travelpayouts" });
  } catch (e) {
    console.error("[api/flight-search]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function parseFlightBody(body: Record<string, unknown>):
  | {
      ok: true;
      value: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate: string | null;
        directOnly: boolean;
        cabinClass: Cabin;
      };
    }
  | { ok: false; error: string } {
  const origin = String(body.origin || "")
    .trim()
    .toUpperCase();
  const destination = String(body.destination || "")
    .trim()
    .toUpperCase();
  const departureDate = String(body.departureDate || "").trim();
  const returnRaw = body.returnDate;
  const returnDate =
    returnRaw === null || returnRaw === undefined || returnRaw === ""
      ? null
      : String(returnRaw).trim();

  if (!/^[A-Z]{3}$/.test(origin)) {
    return { ok: false, error: "Origin must be a 3-letter IATA code." };
  }
  if (!/^[A-Z]{3}$/.test(destination)) {
    return { ok: false, error: "Destination must be a 3-letter IATA code." };
  }
  if (origin === destination) {
    return { ok: false, error: "Origin and destination must differ." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return { ok: false, error: "Departure must be YYYY-MM-DD." };
  }
  if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    return { ok: false, error: "Return date must be YYYY-MM-DD or empty for one-way." };
  }
  if (returnDate && returnDate < departureDate) {
    return { ok: false, error: "Return must be on or after departure." };
  }

  const directOnly = Boolean(body.directOnly);
  const cabinRaw = String(body.cabinClass || "economy").toLowerCase();
  const allowed: Cabin[] = ["economy", "premium_economy", "business", "first"];
  const cabinClass = (allowed.includes(cabinRaw as Cabin) ? cabinRaw : "economy") as Cabin;

  return {
    ok: true,
    value: {
      origin,
      destination,
      departureDate,
      returnDate,
      directOnly,
      cabinClass,
    },
  };
}
