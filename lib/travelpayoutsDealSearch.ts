import { convertToUsd } from "@/lib/fx";
import type { FlightOfferPublic, FlightSegmentPublic, FlightSlicePublic } from "@/lib/flightTypes";
const PRICES_FOR_DATES = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";

type TpPriceRow = {
  origin?: string;
  destination?: string;
  origin_airport?: string;
  destination_airport?: string;
  price?: number;
  currency?: string;
  airline?: string;
  flight_number?: string | number;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  link?: string;
};

/**
 * Partner landing URL: relative `link` from API + base host + marker (Travelpayouts attribution).
 * @see https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
 */
export function travelpayoutsDealReferralUrl(relativeLink: string, marker: string, baseHost: string): string {
  const base = baseHost.replace(/\/$/, "");
  const path = relativeLink.startsWith("/") ? relativeLink : `/${relativeLink}`;
  const url = new URL(`${base}${path}`);
  url.searchParams.set("marker", marker);
  return url.toString();
}

function passesDirect(
  directOnly: boolean,
  transfers: number | undefined,
  returnTransfers: number | undefined,
  hasReturn: boolean,
): boolean {
  if (!directOnly) return true;
  const out = transfers ?? 0;
  const back = returnTransfers ?? 0;
  if (hasReturn) return out === 0 && back === 0;
  return out === 0;
}

function buildSlices(row: TpPriceRow): FlightSlicePublic[] {
  const o = (row.origin_airport || row.origin || "").toUpperCase();
  const d = (row.destination_airport || row.destination || "").toUpperCase();
  const airline = (row.airline || "").toUpperCase();
  const fn = row.flight_number != null ? String(row.flight_number) : "";
  const stopsOut = row.transfers ?? 0;
  const airlineLabel =
    airline || (stopsOut > 0 ? `${stopsOut} stop(s) outbound` : "Flight");

  const outSeg: FlightSegmentPublic = {
    originCode: o,
    originName: o,
    destCode: d,
    destName: d,
    departsAt: row.departure_at || "",
    arrivesAt: row.departure_at || "",
    airlineName: airlineLabel,
    airlineIata: airline || undefined,
    flightNumber: fn || (stopsOut > 0 ? `${stopsOut} stop(s)` : ""),
  };

  const slices: FlightSlicePublic[] = [{ segments: [outSeg] }];

  if (row.return_at) {
    const stopsBack = row.return_transfers ?? 0;
    const backLabel =
      airline || (stopsBack > 0 ? `${stopsBack} stop(s) return` : "Flight");
    const retSeg: FlightSegmentPublic = {
      originCode: d,
      originName: d,
      destCode: o,
      destName: o,
      departsAt: row.return_at,
      arrivesAt: row.return_at,
      airlineName: backLabel,
      airlineIata: airline || undefined,
      flightNumber: fn || (stopsBack > 0 ? `${stopsBack} stop(s)` : ""),
    };
    slices.push({ segments: [retSeg] });
  }

  return slices;
}

/**
 * Cached “deals” from the public data API (no 50k MAU Flight Search API).
 * Each row includes a unique `link` → we attach your marker for referral tracking.
 */
export async function fetchTravelpayoutsDataDeals(input: {
  apiToken: string;
  marker: string;
  dealBaseUrl: string;
  market?: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  directOnly: boolean;
  limit: number;
}): Promise<
  | { ok: true; offers: FlightOfferPublic[]; emptyHint?: string }
  | { ok: false; error: string; status?: number }
> {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    departure_at: input.departureDate,
    unique: "false",
    sorting: "price",
    direct: input.directOnly ? "true" : "false",
    cy: "usd",
    limit: String(Math.min(Math.max(input.limit, 1), 30)),
    page: "1",
    one_way: input.returnDate ? "false" : "true",
    token: input.apiToken,
  });
  if (input.returnDate) params.set("return_at", input.returnDate);
  if (input.market?.trim()) params.set("market", input.market.trim());

  let res: Response;
  try {
    res = await fetch(`${PRICES_FOR_DATES}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Access-Token": input.apiToken,
      },
      cache: "no-store",
    });
  } catch (e) {
    console.error("[Travelpayouts] prices_for_dates network", e);
    return { ok: false, error: "Could not reach Travelpayouts data API.", status: 502 };
  }

  let json: { success?: boolean; data?: unknown; error?: string | null } | null = null;
  try {
    json = (await res.json()) as { success?: boolean; data?: unknown; error?: string | null };
  } catch {
    return { ok: false, error: "Invalid response from Travelpayouts data API.", status: 502 };
  }

  if (!res.ok || !json || json.success === false) {
    const msg =
      typeof json?.error === "string" && json.error.trim()
        ? json.error.trim()
        : `Travelpayouts data API error (HTTP ${res.status}).`;
    return { ok: false, error: msg, status: res.status >= 400 ? res.status : 502 };
  }

  const rows = Array.isArray(json.data) ? (json.data as TpPriceRow[]) : [];
  const offers: FlightOfferPublic[] = [];
  let idx = 0;

  for (const row of rows) {
    const link = typeof row.link === "string" ? row.link.trim() : "";
    if (!link) continue;

    const hasReturn = Boolean(row.return_at && String(row.return_at).trim());
    if (
      !passesDirect(input.directOnly, row.transfers, row.return_transfers, hasReturn)
    ) {
      continue;
    }

    const price = Number(row.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    const cur = (row.currency || "usd").toString();
    const totalUsd = await convertToUsd(price, cur);
    if (totalUsd === null) continue;

    let referralUrl: string;
    try {
      referralUrl = travelpayoutsDealReferralUrl(link, input.marker, input.dealBaseUrl);
    } catch {
      continue;
    }
    const id = `deal-${idx}-${referralUrl.slice(-48)}`;
    idx += 1;

    offers.push({
      id,
      totalUsd: Math.round(totalUsd * 100) / 100,
      totalCurrency: "USD",
      slices: buildSlices(row),
      agencyName: "Aviasales",
      referralUrl,
    });
  }

  offers.sort((a, b) => a.totalUsd - b.totalUsd);

  const emptyHint =
    offers.length === 0
      ? "No cached deals for these exact dates. Data reflects recent Aviasales/Jetradar searches (~48h). Try flexible dates or check back later."
      : undefined;

  return { ok: true, offers, emptyHint };
}
