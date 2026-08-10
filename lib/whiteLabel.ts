/**
 * Travelpayouts Aviasales White Label deep links.
 * Docs: Links to the White Label with a completed search form
 * Format: /?flightSearch=ORIGINDDMMDEST[DDMM][class][adults][children][infants]
 * Dates are DDMM (day+month). Adults digit is required.
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

/** Travelpayouts cabin letter (economy = omit). */
export function whiteLabelCabinCode(cabinClass: string): string {
  switch (cabinClass) {
    case "business":
      return "c";
    case "first":
      return "f";
    case "premium_economy":
      return "w";
    default:
      return "";
  }
}

export type WhiteLabelSearchInput = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  cabinClass?: string;
  adults?: number;
  children?: number;
  infants?: number;
};

/**
 * Build White Label URL with prefilled route/dates.
 * Opens live results on flights.flightdealio.com (or NEXT_PUBLIC_WHITELABEL_URL).
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

  const adults = Math.min(9, Math.max(1, Math.floor(input.adults ?? 1)));
  const children = Math.min(9, Math.max(0, Math.floor(input.children ?? 0)));
  const infants = Math.min(9, Math.max(0, Math.floor(input.infants ?? 0)));

  code += whiteLabelCabinCode(input.cabinClass || "economy");
  code += String(adults);
  if (children > 0 || infants > 0) {
    code += String(children) + String(infants);
  }

  return `${WHITELABEL_BASE_URL}/?flightSearch=${encodeURIComponent(code)}`;
}
