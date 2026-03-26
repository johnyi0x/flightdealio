import { NextRequest, NextResponse } from "next/server";
import { fetchDuffelPlaceSuggestions } from "@/lib/duffelPlaces";

/**
 * Autocomplete airports/cities for the flight search form (Duffel Places API).
 */
export async function GET(req: NextRequest) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing DUFFEL_ACCESS_TOKEN on server." },
      { status: 500 },
    );
  }

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ ok: true, places: [] });
  }

  const places = await fetchDuffelPlaceSuggestions({ token, query: q });
  const slim = places.slice(0, 12).map((p) => ({
    type: p.type,
    name: p.name,
    iata_code: p.iata_code,
    iata_city_code: p.iata_city_code,
    city_name: p.city_name,
    country: p.iata_country_code,
    label: formatPlaceLabel(p),
  }));

  return NextResponse.json({ ok: true, places: slim });
}

function formatPlaceLabel(p: {
  type?: string;
  name?: string;
  iata_code?: string;
  city_name?: string;
  iata_country_code?: string;
}): string {
  const code = p.iata_code || "";
  const city = p.city_name || "";
  const country = p.iata_country_code || "";
  if (p.type === "city") {
    return `${p.name || city || code} (${code}) — city`;
  }
  return `${p.name || code} (${code})${city ? ` · ${city}` : ""}${country ? `, ${country}` : ""}`;
}
