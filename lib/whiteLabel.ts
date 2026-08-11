/**
 * Travelpayouts Aviasales White Label deep links (affiliate-supported).
 * Docs: https://support.travelpayouts.com/hc/en-us/articles/115003710648
 *
 * Format: /?flightSearch=ORIGINDDMMDEST[DDMM][class][adults][children][infants]
 * - Dates: DDMM (day+month), no year
 * - Class: omit = Economy, c = Business, w = Comfort, f = First
 * - Adults digit required; children + infants digits when either > 0
 *
 * Airline preference is NOT part of this deep-link format — users filter
 * airlines on the White Label results page after search.
 */

export const WHITELABEL_BASE_URL = (
  process.env.NEXT_PUBLIC_WHITELABEL_URL?.trim() || "https://flights.flightdealio.com"
).replace(/\/$/, "");

/** Convert YYYY-MM-DD → DDMM for White Label flightSearch. */
export function isoToWhiteLabelDdMm(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  return `${m[3]}${m[2]}`;
}

/**
 * Cabin letter for flightSearch.
 * FlightDealio WL UI exposes Economy + Business only — map anything else to those.
 */
export function whiteLabelCabinCode(cabinClass: string): string {
  switch (cabinClass) {
    case "business":
    case "c":
      return "c";
    case "first":
    case "f":
      // Supported by TP deep links, but not shown on our WL form UI
      return "f";
    case "premium_economy":
    case "comfort":
    case "w":
      return "w";
    default:
      return ""; // economy
  }
}

export type WhiteLabelSearchInput = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  /** economy | business (preferred); comfort/first also encode if passed */
  cabinClass?: string;
  adults?: number;
  /** Children ~2–11 */
  children?: number;
  /** Infants under 2 */
  infants?: number;
};

/**
 * Build White Label URL with prefilled route, dates, cabin, and passengers.
 * Opens live results on flights.flightdealio.com (or NEXT_PUBLIC_WHITELABEL_URL).
 * Uses official ?flightSearch= deep links — same tracked affiliate path as searching on WL.
 */
export function buildWhiteLabelSearchUrl(input: WhiteLabelSearchInput): string | null {
  const origin = input.origin.trim().toUpperCase();
  const destination = input.destination.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) return null;

  const dep = isoToWhiteLabelDdMm(input.departureDate);
  if (!dep) return null;

  let code = `${origin}${dep}${destination}`;
  const retRaw = input.returnDate?.trim();
  if (retRaw) {
    const ret = isoToWhiteLabelDdMm(retRaw);
    if (!ret) return null;
    code += ret;
  }

  let adults = Math.min(9, Math.max(1, Math.floor(input.adults ?? 1)));
  let children = Math.min(9, Math.max(0, Math.floor(input.children ?? 0)));
  let infants = Math.min(9, Math.max(0, Math.floor(input.infants ?? 0)));
  // Aviasales rule: infants cannot exceed adults
  if (infants > adults) infants = adults;
  // Cap total party size reasonably for the single-digit encoding
  while (adults + children + infants > 9 && children > 0) children -= 1;
  while (adults + children + infants > 9 && infants > 0) infants -= 1;

  code += whiteLabelCabinCode(input.cabinClass || "economy");
  code += String(adults);
  // Docs: when children or infants are set, both digits are included (use 0 when needed)
  if (children > 0 || infants > 0) {
    code += String(children) + String(infants);
  }

  return `${WHITELABEL_BASE_URL}/?flightSearch=${encodeURIComponent(code)}`;
}
