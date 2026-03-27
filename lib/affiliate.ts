/**
 * Kiwi.com affiliate deep links (Travelpayouts marker / affilid).
 * We keep URL building isolated so you can swap partners without touching Duffel.
 */

const TP_KIWI_CLICK = "https://c111.travelpayouts.com/click";

/**
 * Wraps any Kiwi.com URL with Travelpayouts click tracking (promo_id 5000).
 * Use after setting `affilid` on the target URL when needed.
 */
export function wrapTravelpayoutsKiwiPartnerUrl(targetUrl: string, marker: string): string {
  const enc = encodeURIComponent(targetUrl);
  return `${TP_KIWI_CLICK}?shmarker=${encodeURIComponent(marker.trim())}&promo_id=5000&source_type=customlink&type=click&custom_url=${enc}`;
}

/**
 * Builds a Kiwi deep link with route + dates so the partner site opens closer to
 * the itinerary the user saw. Kiwi inventory may still differ from Duffel quotes.
 */
export function buildKiwiFlightsDeepLink(input: {
  marker: string;
  from: string;
  to: string;
  departure: string;
  returnDate?: string | null;
}): string {
  const marker = input.marker.trim();
  const q = new URLSearchParams();
  if (marker) q.set("affilid", marker);
  q.set("from", input.from.toUpperCase());
  q.set("to", input.to.toUpperCase());
  q.set("departure", input.departure);
  if (input.returnDate) q.set("return", input.returnDate);
  q.set("currency", "USD");
  return `https://www.kiwi.com/deep?${q.toString()}`;
}

/**
 * Generic Kiwi search for route + dates — **no Tequila API**. Opens Kiwi’s normal search with your marker;
 * use only when you have no per-itinerary deep_link (honest fallback for new sites).
 */
export function travelpayoutsAffiliateKiwiSearchForRoute(input: {
  marker: string;
  from: string;
  to: string;
  departure: string;
  returnDate?: string | null;
}): string {
  const deep = buildKiwiFlightsDeepLink(input);
  try {
    const u = new URL(deep);
    if (input.marker.trim()) u.searchParams.set("affilid", input.marker.trim());
    u.searchParams.set("currency", "USD");
    return wrapTravelpayoutsKiwiPartnerUrl(u.toString(), input.marker.trim());
  } catch {
    return wrapTravelpayoutsKiwiPartnerUrl(deep, input.marker.trim());
  }
}

/**
 * Same as `buildKiwiFlightsDeepLink` but named for the budget explorer flow where
 * outbound/return come from the planning month + nights rule.
 */
export function buildKiwiBudgetFlightsLink(input: {
  marker: string;
  originIata: string;
  destinationIata: string;
  outboundDate: string;
  returnDate: string;
}): string {
  return buildKiwiFlightsDeepLink({
    marker: input.marker,
    from: input.originIata,
    to: input.destinationIata,
    departure: input.outboundDate,
    returnDate: input.returnDate,
  });
}
