import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { suggestTravelpayoutsAirports } from "@/lib/travelpayoutsAirports";

export const dynamic = "force-dynamic";

/**
 * Airport autocomplete via Travelpayouts static airport list (no Duffel).
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const cap = rateLimitMax("RATE_LIMIT_PLACES_PER_MIN", 120);
    if (!allowRateLimit("places", ip, cap)) {
      return NextResponse.json({ ok: false, places: [] }, { status: 429 });
    }

    const token = process.env.TRAVELPAYOUTS_API_TOKEN?.trim();
    if (!token) {
      console.error("[api/places] missing TRAVELPAYOUTS_API_TOKEN");
      return NextResponse.json({ ok: false, places: [] }, { status: 503 });
    }

    const q = (new URL(req.url).searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ ok: true, places: [] });
    }

    const places = await suggestTravelpayoutsAirports({ token, query: q, limit: 15 });
    const slim = places.map((p) => ({
      type: p.type,
      iata_code: p.iata_code,
      iata_city_code: p.iata_city_code,
      label: p.label,
    }));

    return NextResponse.json({ ok: true, places: slim });
  } catch (e) {
    console.error("[api/places]", e);
    return NextResponse.json({ ok: false, places: [] }, { status: 500 });
  }
}
