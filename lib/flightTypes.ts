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
   * Resolve the partner booking URL on click via `/api/travelpayouts-click`
   * (matches the listed price for this row).
   */
  travelpayoutsClick: { searchId: string; termsUrl: number };
};
