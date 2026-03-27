import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { fetchKiwiTequilaDeals } from "@/lib/kiwiTequilaSearch";
import { parseFlightSearchBody } from "@/lib/parseFlightSearchBody";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { fetchTravelpayoutsDataDeals } from "@/lib/travelpayoutsDealSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const kiwiTequilaKey = process.env.KIWI_TEQUILA_API_KEY?.trim();

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
    const tpLimit = Math.min(limit, 30);

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
      limit: tpLimit,
    });

    if (!result.ok) {
      const st =
        result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
      return NextResponse.json({ ok: false, error: result.error }, { status: st });
    }

    let offers = result.offers;
    let source: "travelpayouts_data" | "kiwi_tequila" = "travelpayouts_data";
    let kiwiDisclaimer: string | undefined;

    if (offers.length === 0 && kiwiTequilaKey) {
      const kiwiOffers = await fetchKiwiTequilaDeals({
        apiKey: kiwiTequilaKey,
        affilid: marker,
        origin: parsed.value.origin,
        destination: parsed.value.destination,
        departureDate: parsed.value.departureDate,
        returnDate: parsed.value.returnDate,
        directOnly: parsed.value.directOnly,
        limit: Math.min(limit, 30),
      });
      if (kiwiOffers.length > 0) {
        offers = kiwiOffers;
        source = "kiwi_tequila";
        kiwiDisclaimer =
          "Each row opens Kiwi.com on that exact itinerary (deep link from Kiwi’s API), with your Travelpayouts marker on the link and click tracking. Price can change before checkout.";
      }
    }

    const cabinNote =
      parsed.value.cabinClass !== "economy"
        ? "Cached Travelpayouts rows are usually economy; pick cabin on the partner site."
        : undefined;

    const dealDisclaimer = cabinNote || undefined;

    const emptyHint =
      offers.length === 0
        ? result.emptyHint ||
          "Add KIWI_TEQUILA_API_KEY on the server (free Tequila key from Kiwi) for live Kiwi itineraries with exact booking deep links and your Travelpayouts marker."
        : undefined;

    return NextResponse.json({
      ok: true,
      offers,
      emptyHint,
      source,
      dealDisclaimer: dealDisclaimer || undefined,
      kiwiDisclaimer,
    });
  } catch (e) {
    console.error("[api/deal-search]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong loading deals." },
      { status: 500 },
    );
  }
}
