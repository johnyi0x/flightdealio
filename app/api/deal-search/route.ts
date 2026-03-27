import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { parseFlightSearchBody } from "@/lib/parseFlightSearchBody";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { fetchTravelpayoutsDataDeals } from "@/lib/travelpayoutsDealSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEFAULT_DEAL_BASE = "https://www.aviasales.com";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const cap = rateLimitMax("RATE_LIMIT_FLIGHT_SEARCH_PER_MIN", 30);
    if (!allowRateLimit("deal-search", ip, cap)) {
      return NextResponse.json(
        { ok: false, error: "Too many searches. Please wait a minute and try again." },
        { status: 429 },
      );
    }

    const tpToken = process.env.TRAVELPAYOUTS_API_TOKEN?.trim();
    const marker = (process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "").trim();
    const dealBase =
      process.env.TRAVELPAYOUTS_DEAL_BASE_URL?.trim() || DEFAULT_DEAL_BASE;
    const market = process.env.TRAVELPAYOUTS_DATA_MARKET?.trim();

    if (!tpToken || !marker) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Flight deals are not configured. Add TRAVELPAYOUTS_API_TOKEN and NEXT_PUBLIC_TRAVELPAYOUTS_MARKER.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseFlightSearchBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const limit = rateLimitMax("FLIGHT_RESULTS_CAP", 80);
    const result = await fetchTravelpayoutsDataDeals({
      apiToken: tpToken,
      marker,
      dealBaseUrl: dealBase,
      market,
      origin: parsed.value.origin,
      destination: parsed.value.destination,
      departureDate: parsed.value.departureDate,
      returnDate: parsed.value.returnDate,
      directOnly: parsed.value.directOnly,
      limit: Math.min(limit, 30),
    });

    if (!result.ok) {
      const st =
        result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
      return NextResponse.json({ ok: false, error: result.error }, { status: st });
    }

    return NextResponse.json({
      ok: true,
      offers: result.offers,
      emptyHint: result.emptyHint,
      source: "travelpayouts_data" as const,
      dealDisclaimer:
        parsed.value.cabinClass !== "economy"
          ? "Cached deals are usually economy-focused; choose cabin on the partner site."
          : undefined,
    });
  } catch (e) {
    console.error("[api/deal-search]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong loading deals." },
      { status: 500 },
    );
  }
}
