import { NextRequest, NextResponse } from "next/server";
import { getClientIpForTravelpayouts, getClientIpFromRequest } from "@/lib/clientIp";
import { parseFlightSearchBody } from "@/lib/parseFlightSearchBody";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { startTravelpayoutsFlightSearch } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function resolveRequestHost(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host");
  let h =
    forwarded?.split(",")[0]?.trim() || req.headers.get("host")?.trim() || "localhost";
  // Travelpayouts matches host to the verified site; strip default ports.
  h = h.replace(/:443$/i, "").replace(/:80$/i, "");
  return h;
}

/** Host sent in flight_search body — must match Travelpayouts “Website” (www vs apex matters). */
function travelpayoutsVerifiedHost(req: NextRequest): string {
  const raw = process.env.TRAVELPAYOUTS_VERIFIED_HOST?.trim();
  if (raw) {
    try {
      const u = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`);
      return u.hostname;
    } catch {
      return raw.replace(/^https?:\/\//i, "").split("/")[0]!.split(":")[0]!;
    }
  }
  return resolveRequestHost(req);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const flightCap = rateLimitMax("RATE_LIMIT_FLIGHT_SEARCH_PER_MIN", 30);
    if (!allowRateLimit("flight-search-start", ip, flightCap)) {
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
            "Flight search is not configured. Add TRAVELPAYOUTS_API_TOKEN and NEXT_PUBLIC_TRAVELPAYOUTS_MARKER.",
        },
        { status: 503 },
      );
    }

    const userIp = getClientIpForTravelpayouts(req);
    if (!userIp) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not detect your network for this search. Try another connection.",
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseFlightSearchBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const started = await startTravelpayoutsFlightSearch({
      apiToken: tpToken,
      marker,
      host: travelpayoutsVerifiedHost(req),
      userIp,
      origin: parsed.value.origin,
      destination: parsed.value.destination,
      departureDate: parsed.value.departureDate,
      returnDate: parsed.value.returnDate,
      cabinClass: parsed.value.cabinClass,
    });

    if (!started.ok) {
      const st =
        started.status && started.status >= 400 && started.status < 600 ? started.status : 502;
      return NextResponse.json({ ok: false, error: started.error }, { status: st });
    }

    return NextResponse.json({ ok: true, searchId: started.searchId });
  } catch (e) {
    console.error("[api/flight-search/start]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong starting the search." },
      { status: 500 },
    );
  }
}
