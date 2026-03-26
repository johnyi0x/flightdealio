/**
 * Duffel needs explicit origin/destination pairs. This curated list stands in for
 * "everywhere you might go" until we add smarter geography rules or another
 * discovery API.
 */
export const DESTINATION_AIRPORT_SEEDS: string[] = [
  "LHR",
  "CDG",
  "BCN",
  "MAD",
  "FCO",
  "AMS",
  "LIS",
  "DUB",
  "BER",
  "ZRH",
  "VIE",
  "PRG",
  "ATH",
  "CPH",
  "ARN",
  "LAX",
  "SFO",
  "MIA",
  "SEA",
  "LAS",
  "DEN",
  "HNL",
  "CUN",
  "SJO",
  "LIM",
  "BOG",
  "GIG",
  "NRT",
  "ICN",
  "BKK",
  "SIN",
  "HKG",
  "SYD",
  "AKL",
  "YYZ",
  "YVR",
];

/**
 * Picks up to `limit` destinations for this search, skipping the origin airport
 * and shuffling deterministically so the same inputs feel stable but not
 * alphabetically biased.
 */
export function pickDestinationBatch(input: {
  origin: string;
  limit: number;
  salt: string;
}): string[] {
  const origin = input.origin.toUpperCase();
  const pool = DESTINATION_AIRPORT_SEEDS.filter((code) => code !== origin);
  const scored = pool.map((code) => ({ code, score: hash32(`${input.salt}:${code}`) }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, input.limit).map((row) => row.code);
}

/** Tiny deterministic hash so shuffle does not need crypto imports. */
function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
