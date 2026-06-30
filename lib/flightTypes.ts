/**
 * Shared flight result shapes.
 *
 * A result is ONE itinerary (the actual flights) that can be sold by MANY sellers
 * (Aviasales, Kiwi.com, Trip.com, …). Each seller has its own price and its own
 * booking link, so the UI can compare sellers the way Aviasales does — instead of
 * just bouncing the user to one partner's search page.
 */
export type FlightSegmentPublic = {
  originCode: string;
  originName: string;
  destCode: string;
  destName: string;
  departsAt: string;
  arrivesAt: string;
  airlineName: string;
  airlineIata?: string;
  flightNumber: string;
  aircraftName?: string;
  aircraftIata?: string;
};

export type FlightSlicePublic = {
  duration?: string;
  segments: FlightSegmentPublic[];
};

/** One place that sells this exact itinerary. */
export type FlightSeller = {
  /** Display name on the Book button (e.g. "Kiwi.com", "Aviasales", "Trip.com"). */
  name: string;
  totalUsd: number;
  totalCurrency: string;
  /**
   * Pre-built booking URL that already carries your marker (data-API & Kiwi deep links).
   * Opens that specific fare/itinerary on the partner.
   */
  referralUrl?: string;
  /**
   * Real-time Flight Search API: resolve the short-lived booking URL on click via
   * `/api/travelpayouts-click` using these ids.
   */
  travelpayoutsClick?: { searchId: string; termsUrl: number };
};

export type FlightOfferPublic = {
  id: string;
  /** The itinerary (outbound + optional return). Same for every seller below. */
  slices: FlightSlicePublic[];
  /** Sellers for this itinerary, cheapest first. Always at least one. */
  sellers: FlightSeller[];
  /** Cheapest seller price — used for sorting and the headline number. */
  cheapestUsd: number;
  totalCurrency: string;
  /**
   * "exact" = matches the dates the user searched.
   * "flex"  = a nearby-date deal (±7 days) shown only when nothing exact exists.
   */
  dateTier?: "exact" | "flex";
  emissionsKg?: string;
};
