import { convertToUsd } from "@/lib/fx";

export type DuffelOffer = {
  total_amount?: string;
  total_currency?: string;
  slices?: Array<{
    destination?: {
      iata_code?: string;
      iata_city_code?: string;
      city_name?: string;
      name?: string;
    };
  }>;
};

export type DuffelOfferRequestResponse = {
  data?: {
    offers?: DuffelOffer[];
    id?: string;
  };
  errors?: unknown;
};

const DUFFEL_API = "https://api.duffel.com/air/offer_requests";

/**
 * Posts a round-trip Offer Request and returns the cheapest converted-to-USD fare
 * plus a human label pulled from Duffel's airport metadata.
 */
export async function fetchCheapestRoundTripUsd(input: {
  token: string;
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate: string;
}): Promise<{
  flightUsd: number;
  destinationAirport: string;
  destinationCityCode: string;
  destinationLabel: string;
} | null> {
  const body = {
    data: {
      slices: [
        {
          origin: input.origin,
          destination: input.destination,
          departure_date: input.outboundDate,
        },
        {
          origin: input.destination,
          destination: input.origin,
          departure_date: input.returnDate,
        },
      ],
      passengers: [{ type: "adult" }],
      cabin_class: "economy",
    },
  };

  const url = `${DUFFEL_API}?return_offers=true&supplier_timeout=25000`;
  console.log("[Duffel] POST offer_requests", {
    url,
    origin: input.origin,
    destination: input.destination,
    outboundDate: input.outboundDate,
    returnDate: input.returnDate,
  });

  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as DuffelOfferRequestResponse & { meta?: unknown };
  console.log("[Duffel] offer_requests response", json);

  if (!res.ok) return null;
  const offers = json.data?.offers ?? [];
  if (offers.length === 0) return null;

  let bestUsd: number | null = null;
  let bestOffer: DuffelOffer | null = null;

  for (const offer of offers) {
    const amount = Number(offer.total_amount);
    const currency = offer.total_currency;
    if (!Number.isFinite(amount) || !currency) continue;
    const usd = await convertToUsd(amount, currency);
    if (usd === null) continue;
    if (bestUsd === null || usd < bestUsd) {
      bestUsd = usd;
      bestOffer = offer;
    }
  }

  if (bestUsd === null || !bestOffer) return null;

  const destSlice = bestOffer.slices?.[0]?.destination;
  const destinationAirport = destSlice?.iata_code || input.destination;
  const destinationCityCode =
    destSlice?.iata_city_code?.toUpperCase() || input.destination;
  const destinationLabel =
    destSlice?.city_name || destSlice?.name || destinationAirport;

  return {
    flightUsd: Math.round(bestUsd * 100) / 100,
    destinationAirport,
    destinationCityCode,
    destinationLabel,
  };
}
