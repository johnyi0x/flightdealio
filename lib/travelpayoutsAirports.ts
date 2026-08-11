/**
 * Airport / city autocomplete using Travelpayouts static data.
 * Cached in memory for the lifetime of the serverless instance.
 */

type RawAirport = {
  code?: string;
  name?: string;
  city_code?: string;
  country_code?: string;
};

type RawCity = {
  code?: string;
  name?: string;
  country_code?: string;
  name_translations?: Record<string, string>;
};

let airportCache: { airports: RawAirport[]; fetchedAt: number } | null = null;
let cityCache: { cities: RawCity[]; fetchedAt: number } | null = null;
const CACHE_MS = 1000 * 60 * 60 * 12;

/** Strip spaces/punctuation so "newyork" matches "New York". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function fetchTpJson(url: string, token: string): Promise<unknown | null> {
  let res = await fetch(`${url}?token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    res = await fetch(url, {
      cache: "no-store",
      headers: { "x-access-token": token },
    });
  }
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function asList<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) return parsed as T[];
  if (parsed && typeof parsed === "object") {
    return Object.values(parsed as Record<string, T>);
  }
  return [];
}

async function loadAirports(token: string): Promise<RawAirport[]> {
  const now = Date.now();
  if (airportCache && now - airportCache.fetchedAt < CACHE_MS) {
    return airportCache.airports;
  }

  const parsed = await fetchTpJson(
    "https://api.travelpayouts.com/data/en/airports.json",
    token,
  );
  if (!parsed) {
    console.error("[travelpayoutsAirports] airports fetch failed");
    return airportCache?.airports ?? [];
  }

  const list = asList<RawAirport>(parsed);
  airportCache = { airports: list, fetchedAt: now };
  return list;
}

async function loadCities(token: string): Promise<RawCity[]> {
  const now = Date.now();
  if (cityCache && now - cityCache.fetchedAt < CACHE_MS) {
    return cityCache.cities;
  }

  const parsed = await fetchTpJson(
    "https://api.travelpayouts.com/data/en/cities.json",
    token,
  );
  if (!parsed) {
    console.error("[travelpayoutsAirports] cities fetch failed");
    return cityCache?.cities ?? [];
  }

  const list = asList<RawCity>(parsed);
  cityCache = { cities: list, fetchedAt: now };
  return list;
}

export type AirportSuggestion = {
  type: "airport" | "city";
  iata_code: string;
  iata_city_code?: string;
  label: string;
};

type Ranked = AirportSuggestion & { score: number };

/**
 * Match IATA, city names, and airport names. Space-insensitive so
 * "newyork" / "losangeles" / "sanfrancisco" resolve like spaced names.
 */
export async function suggestTravelpayoutsAirports(input: {
  token: string;
  query: string;
  limit: number;
}): Promise<AirportSuggestion[]> {
  const raw = input.query.trim();
  const q = raw.toLowerCase();
  const qNorm = normalize(raw);
  if (qNorm.length < 2) return [];

  const [airports, cities] = await Promise.all([
    loadAirports(input.token),
    loadCities(input.token),
  ]);

  const ranked: Ranked[] = [];
  const seen = new Set<string>();

  const push = (row: Ranked) => {
    const key = `${row.type}:${row.iata_code}`;
    if (seen.has(key)) return;
    seen.add(key);
    ranked.push(row);
  };

  for (const c of cities) {
    const code = String(c.code || "").toUpperCase();
    if (!code || code.length !== 3) continue;
    const name = c.name || "";
    const nameL = name.toLowerCase();
    const nameN = normalize(name);
    if (!nameN) continue;

    let score = 0;
    if (code.toLowerCase() === q || code.toLowerCase() === qNorm) score = 100;
    else if (nameN === qNorm) score = 95;
    else if (nameN.startsWith(qNorm)) score = 85;
    else if (nameL.startsWith(q)) score = 80;
    else if (nameN.includes(qNorm)) score = 70;
    else if (nameL.includes(q)) score = 65;
    else continue;

    push({
      type: "city",
      iata_code: code,
      iata_city_code: code,
      label: `${name} (${code})`,
      score,
    });
  }

  for (const a of airports) {
    const code = String(
      a.code || (a as { iata_code?: string }).iata_code || "",
    ).toUpperCase();
    if (!code || code.length !== 3) continue;
    const name = a.name || "";
    const nameL = name.toLowerCase();
    const nameN = normalize(name);
    const city = (a.city_code || "").toLowerCase();
    const cityN = normalize(a.city_code || "");

    let score = 0;
    if (code.toLowerCase() === q || code.toLowerCase() === qNorm) score = 100;
    else if (city === q || cityN === qNorm) score = 75;
    else if (nameN === qNorm) score = 72;
    else if (nameN.startsWith(qNorm)) score = 60;
    else if (nameL.startsWith(q)) score = 55;
    else if (nameN.includes(qNorm)) score = 45;
    else if (nameL.includes(q)) score = 40;
    else if (city.startsWith(q) || cityN.startsWith(qNorm)) score = 50;
    else continue;

    const cityCode = a.city_code?.toUpperCase();
    push({
      type: "airport",
      iata_code: code,
      iata_city_code: cityCode,
      label: cityCode && cityCode !== code ? `${name} (${code})` : `${name || code} (${code})`,
      score,
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  return ranked.slice(0, input.limit).map(({ score: _s, ...rest }) => rest);
}
