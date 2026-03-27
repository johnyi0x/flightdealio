/**
 * Airport autocomplete using Travelpayouts static data (same token as the Data API).
 * Cached in memory for the lifetime of the serverless instance.
 */

type RawAirport = {
  code?: string;
  name?: string;
  city_code?: string;
};

let cache: { airports: RawAirport[]; fetchedAt: number } | null = null;
const CACHE_MS = 1000 * 60 * 60 * 12;

async function loadAirports(token: string): Promise<RawAirport[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_MS) {
    return cache.airports;
  }

  let res = await fetch(
    `https://api.travelpayouts.com/data/en/airports.json?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    res = await fetch("https://api.travelpayouts.com/data/en/airports.json", {
      cache: "no-store",
      headers: { "x-access-token": token },
    });
  }
  if (!res.ok) {
    console.error("[travelpayoutsAirports] fetch failed", res.status);
    return cache?.airports ?? [];
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    return cache?.airports ?? [];
  }

  let list: RawAirport[] = [];
  if (Array.isArray(parsed)) {
    list = parsed as RawAirport[];
  } else if (parsed && typeof parsed === "object") {
    list = Object.values(parsed as Record<string, RawAirport>);
  }

  cache = { airports: list, fetchedAt: now };
  return list;
}

export type AirportSuggestion = {
  type: "airport";
  iata_code: string;
  iata_city_code?: string;
  label: string;
};

/**
 * Case-insensitive match on IATA code, airport name, or city code.
 */
export async function suggestTravelpayoutsAirports(input: {
  token: string;
  query: string;
  limit: number;
}): Promise<AirportSuggestion[]> {
  const q = input.query.trim().toLowerCase();
  if (q.length < 2) return [];

  const airports = await loadAirports(input.token);
  const out: AirportSuggestion[] = [];
  const seen = new Set<string>();

  for (const a of airports) {
    const code = String(
      a.code || (a as { iata_code?: string }).iata_code || "",
    ).toUpperCase();
    if (!code || code.length !== 3) continue;
    const name = (a.name || "").toLowerCase();
    const city = (a.city_code || "").toLowerCase();
    const match =
      code.toLowerCase().startsWith(q) ||
      name.includes(q) ||
      (city && city.includes(q));
    if (!match) continue;
    if (seen.has(code)) continue;
    seen.add(code);

    const label = `${a.name || code} (${code})`;
    out.push({
      type: "airport",
      iata_code: code,
      iata_city_code: a.city_code?.toUpperCase(),
      label,
    });
    if (out.length >= input.limit) break;
  }

  return out;
}
