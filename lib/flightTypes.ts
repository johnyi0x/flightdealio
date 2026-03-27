/**
 * Shared flight result shapes (Travelpayouts-first; no Duffel in the booking path).
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

export type FlightOfferPublic = {
  id: string;
  totalUsd: number;
  totalCurrency: string;
  emissionsKg?: string;
  slices: FlightSlicePublic[];
  /** Travelpayouts partner (OTA) selling this fare — shown on the book button. */
  agencyName: string;
  /**
   * Data-API deals: open this URL (already includes your `marker`) — one link per cached fare.
   */
  referralUrl?: string;
  /**
   * Real-time Flight Search API: resolve booking URL via `/api/travelpayouts-click`.
   */
  travelpayoutsClick?: { searchId: string; termsUrl: number };
};
