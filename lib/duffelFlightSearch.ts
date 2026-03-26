import { buildKiwiFlightsDeepLink } from "@/lib/affiliate";
import { convertToUsd } from "@/lib/fx";

const OFFER_REQUEST = "https://api.duffel.com/air/offer_requests";

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
  /** Kiwi deep link when the row is priced on Duffel; empty when using `travelpayoutsClick`. */
  affiliateUrl: string;
  /**
   * When set, the agency URL must be fetched on user click (Travelpayouts Search API rules).
   */
  travelpayoutsClick?: { searchId: string; termsUrl: number };
};

type RawOffer = {
  id?: string;
  total_amount?: string;
  total_currency?: string;
  total_emissions_kg?: string;
  slices?: Array<{
    duration?: string;
    segments?: Array<{
      departing_at?: string;
      arriving_at?: string;
      operating_carrier?: { name?: string; iata_code?: string };
      operating_carrier_flight_number?: string;
      marketing_carrier_flight_number?: string;
      aircraft?: { name?: string; iata_code?: string };
      origin?: { iata_code?: string; name?: string };
      destination?: { iata_code?: string; name?: string };
    }>;
  }>;
};

/**
 * Creates an Offer Request and returns the cheapest options with segment-level
 * airline + aircraft details plus a Kiwi affiliate URL that mirrors dates.
 */
export async function searchFlightsWithDuffel(input: {
  token: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  directOnly: boolean;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  affiliateMarker: string;
  limit: number;
}): Promise<FlightOfferPublic[]> {
  const slices =
    input.returnDate && input.returnDate.length > 0
      ? [
          {
            origin: input.origin,
            destination: input.destination,
            departure_date: input.departureDate,
          },
          {
            origin: input.destination,
            destination: input.origin,
            departure_date: input.returnDate,
          },
        ]
      : [
          {
            origin: input.origin,
            destination: input.destination,
            departure_date: input.departureDate,
          },
        ];

  const body = {
    data: {
      slices,
      passengers: [{ type: "adult" }],
      cabin_class: input.cabinClass,
      max_connections: input.directOnly ? 0 : 1,
    },
  };

  const url = `${OFFER_REQUEST}?return_offers=true&supplier_timeout=30000`;
  console.log("[Duffel] POST offer_requests (flight search)", {
    origin: input.origin,
    destination: input.destination,
    departureDate: input.departureDate,
    returnDate: input.returnDate ?? null,
    directOnly: input.directOnly,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    data?: { offers?: RawOffer[] };
    errors?: unknown;
  };
  console.log("[Duffel] flight search offer count", json.data?.offers?.length ?? 0);

  if (!res.ok) return [];
  const offers = json.data?.offers ?? [];

  const mapped: FlightOfferPublic[] = [];
  for (const offer of offers) {
    const row = await mapOfferToPublic(offer, input);
    if (row) mapped.push(row);
  }

  mapped.sort((a, b) => a.totalUsd - b.totalUsd);
  return mapped.slice(0, input.limit);
}

/**
 * Converts one Duffel offer into our public JSON shape and attaches Kiwi URL.
 */
async function mapOfferToPublic(
  offer: RawOffer,
  ctx: {
    affiliateMarker: string;
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string | null;
  },
): Promise<FlightOfferPublic | null> {
  const id = offer.id;
  const amount = Number(offer.total_amount);
  const currency = offer.total_currency;
  if (!id || !Number.isFinite(amount) || !currency) return null;

  const totalUsd = await convertToUsd(amount, currency);
  if (totalUsd === null) return null;

  const slices: FlightSlicePublic[] = [];
  for (const sl of offer.slices ?? []) {
    const segments: FlightSegmentPublic[] = [];
    for (const seg of sl.segments ?? []) {
      const fn =
        seg.operating_carrier_flight_number ||
        seg.marketing_carrier_flight_number ||
        "";
      segments.push({
        originCode: seg.origin?.iata_code || "?",
        originName: seg.origin?.name || seg.origin?.iata_code || "",
        destCode: seg.destination?.iata_code || "?",
        destName: seg.destination?.name || seg.destination?.iata_code || "",
        departsAt: seg.departing_at || "",
        arrivesAt: seg.arriving_at || "",
        airlineName: seg.operating_carrier?.name || "Airline",
        airlineIata: seg.operating_carrier?.iata_code,
        flightNumber: fn,
        aircraftName: seg.aircraft?.name,
        aircraftIata: seg.aircraft?.iata_code,
      });
    }
    if (segments.length > 0) {
      slices.push({ duration: sl.duration, segments });
    }
  }

  const outboundDep =
    offer.slices?.[0]?.segments?.[0]?.departing_at?.slice(0, 10) || ctx.departureDate;
  const returnDep =
    ctx.returnDate && offer.slices && offer.slices.length > 1
      ? offer.slices[1]?.segments?.[0]?.departing_at?.slice(0, 10) || ctx.returnDate
      : undefined;

  const affiliateUrl = buildKiwiFlightsDeepLink({
    marker: ctx.affiliateMarker,
    from: ctx.origin,
    to: ctx.destination,
    departure: outboundDep,
    returnDate: returnDep,
  });

  return {
    id,
    totalUsd: Math.round(totalUsd * 100) / 100,
    totalCurrency: "USD",
    emissionsKg: offer.total_emissions_kg,
    slices,
    affiliateUrl,
  };
}
