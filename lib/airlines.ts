/**
 * IATA airline code → human name.
 *
 * Travelpayouts' data API often returns only the 2-letter carrier code (e.g. "MM"),
 * so the UI showed "MM (MM)". This map turns codes into real names ("Peach Aviation").
 * Not exhaustive — `airlineName()` falls back to any name we already have, then the code.
 */
const AIRLINE_NAMES: Record<string, string> = {
  // East Asia (common on the routes this site targets)
  MM: "Peach Aviation",
  OZ: "Asiana Airlines",
  KE: "Korean Air",
  NH: "ANA (All Nippon Airways)",
  JL: "Japan Airlines",
  "7C": "Jeju Air",
  LJ: "Jin Air",
  TW: "T'way Air",
  BX: "Air Busan",
  RS: "Air Seoul",
  ZE: "Eastar Jet",
  GW: "Aero K",
  RF: "Air Premia",
  YP: "Air Premia",
  GK: "Jetstar Japan",
  IJ: "Spring Japan",
  JW: "Vanilla Air",
  BC: "Skymark Airlines",
  "6J": "Solaseed Air",
  CA: "Air China",
  CZ: "China Southern",
  MU: "China Eastern",
  HU: "Hainan Airlines",
  CI: "China Airlines",
  BR: "EVA Air",
  CX: "Cathay Pacific",
  HX: "Hong Kong Airlines",
  KA: "Cathay Dragon",
  // SE Asia
  SQ: "Singapore Airlines",
  TR: "Scoot",
  MH: "Malaysia Airlines",
  AK: "AirAsia",
  D7: "AirAsia X",
  TG: "Thai Airways",
  FD: "Thai AirAsia",
  PG: "Bangkok Airways",
  VN: "Vietnam Airlines",
  VJ: "VietJet Air",
  QH: "Bamboo Airways",
  GA: "Garuda Indonesia",
  QZ: "Indonesia AirAsia",
  JT: "Lion Air",
  PR: "Philippine Airlines",
  "5J": "Cebu Pacific",
  // South Asia / Middle East
  AI: "Air India",
  "6E": "IndiGo",
  EK: "Emirates",
  EY: "Etihad Airways",
  QR: "Qatar Airways",
  SV: "Saudia",
  TK: "Turkish Airlines",
  GF: "Gulf Air",
  WY: "Oman Air",
  // Oceania
  QF: "Qantas",
  JQ: "Jetstar",
  VA: "Virgin Australia",
  NZ: "Air New Zealand",
  // North America
  AA: "American Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  WN: "Southwest Airlines",
  AS: "Alaska Airlines",
  B6: "JetBlue",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",
  AC: "Air Canada",
  WS: "WestJet",
  AM: "Aeroméxico",
  // Europe
  BA: "British Airways",
  LH: "Lufthansa",
  AF: "Air France",
  KL: "KLM",
  IB: "Iberia",
  AZ: "ITA Airways",
  LX: "SWISS",
  OS: "Austrian Airlines",
  SN: "Brussels Airlines",
  SK: "SAS",
  AY: "Finnair",
  TP: "TAP Air Portugal",
  EI: "Aer Lingus",
  FR: "Ryanair",
  U2: "easyJet",
  W6: "Wizz Air",
  VY: "Vueling",
  DY: "Norwegian",
  SU: "Aeroflot",
  // Latin America / Africa
  LA: "LATAM Airlines",
  AV: "Avianca",
  CM: "Copa Airlines",
  ET: "Ethiopian Airlines",
  SA: "South African Airways",
  MS: "EgyptAir",
  AT: "Royal Air Maroc",
};

/**
 * Resolves a display name for an airline.
 * @param code  IATA carrier code (e.g. "MM"); case-insensitive.
 * @param existingName  A name the provider already gave us (used if the map misses).
 */
export function airlineName(code?: string | null, existingName?: string | null): string {
  const c = (code || "").trim().toUpperCase();
  const mapped = c ? AIRLINE_NAMES[c] : undefined;
  if (mapped) return mapped;

  const given = (existingName || "").trim();
  // Only trust the provider name if it's not just the code echoed back.
  if (given && given.toUpperCase() !== c) return given;

  if (c) return c;
  return given || "Airline";
}
