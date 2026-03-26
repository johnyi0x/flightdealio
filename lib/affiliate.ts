/**
 * Kiwi.com affiliate deep links (Travelpayouts marker / affilid).
 * We keep URL building isolated so you can swap partners without touching Duffel.
 */

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
  const marker = input.marker || "YOUR_MARKER";
  const q = new URLSearchParams();
  q.set("affilid", marker);
  q.set("from", input.from.toUpperCase());
  q.set("to", input.to.toUpperCase());
  q.set("departure", input.departure);
  if (input.returnDate) q.set("return", input.returnDate);
  q.set("currency", "USD");
  return `https://www.kiwi.com/deep?${q.toString()}`;
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
