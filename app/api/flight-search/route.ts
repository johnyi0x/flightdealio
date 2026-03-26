import { NextRequest, NextResponse } from "next/server";
import { searchFlightsWithDuffel } from "@/lib/duffelFlightSearch";
import { searchFlightsWithTravelpayouts } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";

type Cabin = "economy" | "premium_economy" | "business" | "first";

function resolveRequestHost(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("host") || "localhost";
}

/** Travelpayouts requires a non-loopback visitor IP; Vercel sends x-forwarded-for / x-vercel-forwarded-for. */
function resolveUserIp(req: NextRequest): string {
  const override = process.env.TRAVELPAYOUTS_USER_IP?.trim();
  if (override) return override;

  const candidates = [
    req.headers.get("x-vercel-forwarded-for"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(",")[0]!.trim();
    if (first && !first.startsWith("127.") && first !== "::1") return first;
  }
  return "";
}

/**
 * Standard flight search: origin, destination, dates → ranked offers.
 * Travelpayouts when token + marker + client IP exist; otherwise Duffel + Kiwi deep link.
 */
export async function POST(req: NextRequest) {
  try {
    const duffelToken = process.env.DUFFEL_ACCESS_TOKEN;
    const tpToken = process.env.TRAVELPAYOUTS_API_TOKEN?.trim();
    const marker = (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "").trim();

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseFlightBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const common = {
      origin: parsed.value.origin,
      destination: parsed.value.destination,
      departureDate: parsed.value.departureDate,
      returnDate: parsed.value.returnDate,
      directOnly: parsed.value.directOnly,
      cabinClass: parsed.value.cabinClass,
      limit: 20,
    };

    const canTravelpayouts = Boolean(tpToken && marker);
    const userIp = canTravelpayouts ? resolveUserIp(req) : "";
    if (canTravelpayouts && userIp) {
      try {
        const tpOffers = await searchFlightsWithTravelpayouts({
          apiToken: tpToken!,
          marker,
          host: resolveRequestHost(req),
          userIp,
          ...common,
        });
        if (tpOffers.length > 0) {
          return NextResponse.json({ ok: true, offers: tpOffers, source: "travelpayouts" });
        }
      } catch (e) {
        console.error("[api/flight-search] Travelpayouts failed, will try Duffel if configured", e);
      }
    } else if (canTravelpayouts && !userIp) {
      console.warn("[api/flight-search] skipping Travelpayouts: no client IP in request headers");
    }

    if (!duffelToken) {
      return NextResponse.json(
        { ok: false, error: "Search is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const offers = await searchFlightsWithDuffel({
      token: duffelToken,
      affiliateMarker: marker,
      ...common,
    });

    return NextResponse.json({ ok: true, offers, source: "duffel" });
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
