import { buildKiwiFlightsDeepLink } from "@/lib/affiliate";
import { convertToUsd } from "@/lib/fx";
import type { FlightOfferPublic, FlightSegmentPublic, FlightSlicePublic } from "@/lib/flightTypes";
import type { Cabin } from "@/lib/parseFlightSearchBody";

const DUFFEL_API = "https://api.duffel.com/air/offer_requests";

type DuffelSeg = {
  origin?: { iata_code?: string; name?: string };
  destination?: { iata_code?: string; name?: string };
  departing_at?: string;
  arriving_at?: string;
  operating_carrier?: { name?: string; iata_code?: string };
  marketing_carrier?: { name?: string; iata_code?: string };
  marketing_carrier_flight_number?: string;
};

type DuffelSlice = { segments?: DuffelSeg[] };

type DuffelOfferFull = {
  id?: string;
  total_amount?: string;
  total_currency?: string;
  slices?: DuffelSlice[];
};

type DuffelOfferResponse = {
  data?: { offers?: DuffelOfferFull[]; id?: string };
  errors?: unknown;
};

function cabinToDuffel(c: Cabin): string {
  if (c === "premium_economy") return "premium_economy";
  if (c === "business") return "business";
  if (c === "first") return "first";
  return "economy";
}

function mapSlices(offer: DuffelOfferFull): FlightSlicePublic[] {
  const out: FlightSlicePublic[] = [];
  for (const sl of offer.slices ?? []) {
    const segments: FlightSegmentPublic[] = [];
    for (const s of sl.segments ?? []) {
      const o = (s.origin?.iata_code || "").toUpperCase();
      const d = (s.destination?.iata_code || "").toUpperCase();
      if (!o || !d) continue;
      const carrier =
        s.operating_carrier?.iata_code || s.marketing_carrier?.iata_code || "";
      const name =
        s.operating_carrier?.name ||
        s.marketing_carrier?.name ||
        carrier ||
        "Airline";
      const fn = s.marketing_carrier_flight_number?.trim() || "";
      segments.push({
        originCode: o,
        originName: s.origin?.name || o,
        destCode: d,
        destName: s.destination?.name || d,
        departsAt: s.departing_at || "",
        arrivesAt: s.arriving_at || "",
        airlineName: name,
        airlineIata: carrier || undefined,
        flightNumber: fn,
      });
    }
    if (segments.length > 0) out.push({ segments });
  }
  return out;
}

/**
 * Live Duffel offers for the user’s route/dates; each row gets the same Kiwi deep link
 * (`affilid` = Travelpayouts marker) so bookings attribute to your Travelpayouts program.
 * Inventory/price on Kiwi may differ from the Duffel quote.
 */
export async function fetchDuffelDealsWithKiwiReferral(input: {
  token: string;
  marker: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  directOnly: boolean;
  cabinClass: Cabin;
  limit: number;
}): Promise<FlightOfferPublic[]> {
  const slice = (from: string, to: string, date: string) => ({
    origin: from,
    destination: to,
    departure_date: date,
    ...(input.directOnly ? { max_connections: 0 } : {}),
  });

  const slices =
    input.returnDate && input.returnDate.length > 0
      ? [
          slice(input.origin, input.destination, input.departureDate),
          slice(input.destination, input.origin, input.returnDate),
        ]
      : [slice(input.origin, input.destination, input.departureDate)];

  const body = {
    slices,
    passengers: [{ type: "adult" }],
    cabin_class: cabinToDuffel(input.cabinClass),
  };

  const url = `${DUFFEL_API}?return_offers=true&supplier_timeout=28000`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({ data: body }),
    });
  } catch (e) {
    console.error("[Duffel] offer_requests network", e);
    return [];
  }

  let json: DuffelOfferResponse;
  try {
    json = (await res.json()) as DuffelOfferResponse;
  } catch {
    return [];
  }

  if (!res.ok) {
    console.warn("[Duffel] offer_requests HTTP", res.status, json?.errors ?? json);
    return [];
  }

  const offers = json.data?.offers ?? [];
  if (offers.length === 0) return [];

  type Scored = { offer: DuffelOfferFull; usd: number };
  const scored: Scored[] = [];
  for (const offer of offers) {
    const amt = Number(offer.total_amount);
    const cur = offer.total_currency;
    if (!Number.isFinite(amt) || !cur) continue;
    const usd = await convertToUsd(amt, cur);
    if (usd === null) continue;
    scored.push({ offer, usd: Math.round(usd * 100) / 100 });
  }

  scored.sort((a, b) => a.usd - b.usd);
  const top = scored.slice(0, Math.max(1, Math.min(input.limit, 25)));

  const kiwiUrl = buildKiwiFlightsDeepLink({
    marker: input.marker,
    from: input.origin,
    to: input.destination,
    departure: input.departureDate,
    returnDate: input.returnDate,
  });

  const publicOffers: FlightOfferPublic[] = [];
  for (const { offer, usd } of top) {
    const id = typeof offer.id === "string" && offer.id ? offer.id : `duffel-${publicOffers.length}`;
    const slicesMapped = mapSlices(offer);
    if (slicesMapped.length === 0) continue;
    publicOffers.push({
      id,
      totalUsd: usd,
      totalCurrency: "USD",
      slices: slicesMapped,
      agencyName: "Kiwi.com",
      referralUrl: kiwiUrl,
    });
  }

  return publicOffers;
}
