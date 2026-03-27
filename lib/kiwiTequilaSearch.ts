import { wrapTravelpayoutsKiwiPartnerUrl } from "@/lib/affiliate";
import { convertToUsd } from "@/lib/fx";
import type { FlightOfferPublic, FlightSegmentPublic, FlightSlicePublic } from "@/lib/flightTypes";

const TEQUILA_BASE = "https://tequila-api.kiwi.com/v2/search";

type TequilaRouteLeg = {
  flyFrom?: string;
  flyTo?: string;
  cityFrom?: string;
  cityTo?: string;
  airline?: string;
  airlines?: string[];
  flight_no?: number;
  local_departure?: string;
  local_arrival?: string;
};

type TequilaDatum = {
  id?: string;
  price?: number;
  currency?: string;
  booking_token?: string;
  deep_link?: string;
  route?: TequilaRouteLeg[];
  conversion?: Record<string, number>;
};

type TequilaResponse = {
  data?: TequilaDatum[];
  error?: string;
};

function ymdToDdMmYyyy(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Tequila `deep_link` + your affilid + Travelpayouts click wrapper. */
export function travelpayoutsTrackedKiwiDeepLink(deepLink: string, affilid: string): string {
  let target = deepLink.trim();
  if (!target) return target;
  try {
    const u = new URL(target);
    if (affilid) u.searchParams.set("affilid", affilid);
    u.searchParams.set("currency", "USD");
    target = u.toString();
  } catch {
    return target;
  }
  if (!affilid) return target;
  return wrapTravelpayoutsKiwiPartnerUrl(target, affilid);
}

function connectedChunks(route: TequilaRouteLeg[]): TequilaRouteLeg[][] {
  const chunks: TequilaRouteLeg[][] = [];
  let chunk: TequilaRouteLeg[] = [];
  for (let i = 0; i < route.length; i++) {
    const leg = route[i]!;
    chunk.push(leg);
    const next = route[i + 1];
    const nextFrom = (next?.flyFrom || "").toUpperCase();
    const thisTo = (leg.flyTo || "").toUpperCase();
    if (!next || nextFrom !== thisTo) {
      chunks.push(chunk);
      chunk = [];
    }
  }
  return chunks;
}

function chunkToSlice(chunk: TequilaRouteLeg[]): FlightSlicePublic | null {
  const segments: FlightSegmentPublic[] = [];
  for (const leg of chunk) {
    const o = (leg.flyFrom || "").toUpperCase();
    const d = (leg.flyTo || "").toUpperCase();
    if (!o || !d) continue;
    const airline = (leg.airline || leg.airlines?.[0] || "").toUpperCase();
    const fn = leg.flight_no != null ? String(leg.flight_no) : "";
    segments.push({
      originCode: o,
      originName: leg.cityFrom || o,
      destCode: d,
      destName: leg.cityTo || d,
      departsAt: leg.local_departure || "",
      arrivesAt: leg.local_arrival || "",
      airlineName: airline || "Airline",
      airlineIata: airline || undefined,
      flightNumber: fn,
    });
  }
  if (segments.length === 0) return null;
  return { segments };
}

/**
 * Round-trip: first slice = legs until first arrival at `destination` (outbound), rest = return.
 * One-way / open: group by airport chain only.
 */
function routeToSlices(
  route: TequilaRouteLeg[] | undefined,
  destination: string,
  returnDate: string | null,
): FlightSlicePublic[] {
  if (!route?.length) return [];
  const dest = destination.toUpperCase();
  const isRt = Boolean(returnDate?.trim());

  if (!isRt) {
    return connectedChunks(route)
      .map(chunkToSlice)
      .filter((s): s is FlightSlicePublic => s != null);
  }

  let splitIdx = -1;
  for (let i = 0; i < route.length; i++) {
    if ((route[i]!.flyTo || "").toUpperCase() === dest) {
      splitIdx = i;
      break;
    }
  }
  if (splitIdx < 0) {
    return connectedChunks(route)
      .map(chunkToSlice)
      .filter((s): s is FlightSlicePublic => s != null);
  }

  const out = route.slice(0, splitIdx + 1);
  const back = route.slice(splitIdx + 1);
  const slices: FlightSlicePublic[] = [];
  for (const ch of connectedChunks(out)) {
    const sl = chunkToSlice(ch);
    if (sl) slices.push(sl);
  }
  for (const ch of connectedChunks(back)) {
    const sl = chunkToSlice(ch);
    if (sl) slices.push(sl);
  }
  return slices;
}

async function priceUsd(d: TequilaDatum): Promise<number | null> {
  const raw = d.price;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) return null;
  const conv = d.conversion;
  if (conv && typeof conv.USD === "number" && Number.isFinite(conv.USD)) {
    return Math.round(conv.USD * 100) / 100;
  }
  const cur = (d.currency || "USD").toString();
  const u = await convertToUsd(raw, cur);
  return u != null ? Math.round(u * 100) / 100 : null;
}

/**
 * Kiwi.com Tequila search — each result includes `deep_link` for that exact itinerary
 * (flightsId + booking_token), not a generic search page.
 */
export async function fetchKiwiTequilaDeals(input: {
  apiKey: string;
  affilid: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  directOnly: boolean;
  limit: number;
}): Promise<FlightOfferPublic[]> {
  const dep = ymdToDdMmYyyy(input.departureDate);
  const params = new URLSearchParams({
    fly_from: input.origin.toUpperCase(),
    fly_to: input.destination.toUpperCase(),
    date_from: dep,
    date_to: dep,
    curr: "USD",
    sort: "price",
    asc: "1",
    limit: String(Math.min(Math.max(input.limit, 1), 30)),
    adults: "1",
    locale: "us",
  });

  if (input.returnDate?.trim()) {
    const ret = ymdToDdMmYyyy(input.returnDate);
    params.set("flight_type", "round");
    params.set("return_from", ret);
    params.set("return_to", ret);
  }

  if (input.directOnly) params.set("max_stopovers", "0");

  let res: Response;
  try {
    res = await fetch(`${TEQUILA_BASE}?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: input.apiKey,
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
      cache: "no-store",
    });
  } catch (e) {
    console.error("[Kiwi Tequila] search network", e);
    return [];
  }

  let json: TequilaResponse;
  try {
    json = (await res.json()) as TequilaResponse;
  } catch {
    return [];
  }

  if (!res.ok) {
    console.warn("[Kiwi Tequila] search HTTP", res.status, json?.error ?? json);
    return [];
  }

  const rows = Array.isArray(json.data) ? json.data : [];
  const out: FlightOfferPublic[] = [];

  for (const d of rows) {
    const deep = typeof d.deep_link === "string" ? d.deep_link.trim() : "";
    if (!deep) continue;
    const totalUsd = await priceUsd(d);
    if (totalUsd === null) continue;
    const slices = routeToSlices(d.route, input.destination, input.returnDate);
    if (slices.length === 0) continue;
    const id =
      typeof d.id === "string" && d.id
        ? d.id
        : `kiwi-${out.length}-${(d.booking_token || "").slice(0, 12) || "x"}`;
    out.push({
      id,
      totalUsd,
      totalCurrency: "USD",
      slices,
      agencyName: "Kiwi.com",
      referralUrl: travelpayoutsTrackedKiwiDeepLink(deep, input.affilid.trim()),
    });
  }

  out.sort((a, b) => a.totalUsd - b.totalUsd);
  return out;
}
