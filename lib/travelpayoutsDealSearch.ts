import { convertToUsd } from "@/lib/fx";
import type { FlightOfferPublic, FlightSegmentPublic, FlightSlicePublic } from "@/lib/flightTypes";

const PRICES_FOR_DATES = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";

/** Currencies where Aviasales v3 `prices_for_dates` uses smallest units (e.g. cents) as integers. */
const TP_V3_MINOR_UNIT = new Set([
  "usd",
  "eur",
  "gbp",
  "aud",
  "cad",
  "chf",
  "pln",
  "nzd",
]);

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
  duration_to?: number;
  duration_back?: number;
  duration?: number;
  link?: string;
};

export type TravelpayoutsDealsTier = "exact" | "none";

/**
 * Aviasales v3 returns integer `price` in minor units for USD/EUR/… (e.g. 10592 → 105.92 USD).
 * Fractional values are treated as already in major units.
 */
function tpV3PriceToMajorUnits(price: number, currencyRaw: string): number {
  const c = (currencyRaw || "usd").trim().toLowerCase();
  if (!TP_V3_MINOR_UNIT.has(c)) return price;
  if (!Number.isFinite(price)) return price;
  if (!Number.isInteger(price)) return price;
  return price / 100;
}

function arrivesAfterDuration(depIso: string, durationMinutes: number | undefined): string {
  if (!depIso?.trim()) return "";
  if (durationMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "";
  }
  const ms = Date.parse(depIso);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms + durationMinutes * 60_000).toISOString();
}

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

  const depOut = row.departure_at || "";
  const arrOut = arrivesAfterDuration(depOut, row.duration_to);

  const outSeg: FlightSegmentPublic = {
    originCode: o,
    originName: o,
    destCode: d,
    destName: d,
    departsAt: depOut,
    arrivesAt: arrOut,
    airlineName: airlineLabel,
    airlineIata: airline || undefined,
    flightNumber: fn || (stopsOut > 0 ? `${stopsOut} stop(s)` : ""),
  };

  const slices: FlightSlicePublic[] = [{ segments: [outSeg] }];

  if (row.return_at) {
    const stopsBack = row.return_transfers ?? 0;
    const backLabel =
      airline || (stopsBack > 0 ? `${stopsBack} stop(s) return` : "Flight");
    const depRet = row.return_at;
    const arrRet = arrivesAfterDuration(depRet, row.duration_back);
    const retSeg: FlightSegmentPublic = {
      originCode: d,
      originName: d,
      destCode: o,
      destName: o,
      departsAt: depRet,
      arrivesAt: arrRet,
      airlineName: backLabel,
      airlineIata: airline || undefined,
      flightNumber: fn || (stopsBack > 0 ? `${stopsBack} stop(s)` : ""),
    };
    slices.push({ segments: [retSeg] });
  }

  return slices;
}

type OnceResult =
  | { ok: true; offers: FlightOfferPublic[] }
  | { ok: false; error: string; status: number };

async function fetchTravelpayoutsPricesOnce(input: {
  apiToken: string;
  marker: string;
  dealBaseUrl: string;
  market?: string;
  origin: string;
  destination: string;
  departureAt: string;
  returnAt: string | null;
  directOnly: boolean;
  limit: number;
}): Promise<OnceResult> {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    departure_at: input.departureAt,
    unique: "false",
    sorting: "price",
    direct: input.directOnly ? "true" : "false",
    cy: "usd",
    limit: String(Math.min(Math.max(input.limit, 1), 30)),
    page: "1",
    one_way: input.returnAt ? "false" : "true",
    token: input.apiToken,
  });
  if (input.returnAt) params.set("return_at", input.returnAt);
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

    const rawPrice = Number(row.price);
    if (!Number.isFinite(rawPrice) || rawPrice <= 0) continue;

    const cur = (row.currency || "usd").toString();
    const major = tpV3PriceToMajorUnits(rawPrice, cur);
    const totalUsd = await convertToUsd(major, cur);
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
  return { ok: true, offers };
}

/**
 * Cached deals for the **exact** dates only (same as the user’s search).
 * No month-wide fallback — that showed wrong dates vs the search and looked broken.
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
  | {
      ok: true;
      offers: FlightOfferPublic[];
      emptyHint?: string;
      cacheTier: TravelpayoutsDealsTier;
    }
  | { ok: false; error: string; status?: number }
> {
  const exact = await fetchTravelpayoutsPricesOnce({
    apiToken: input.apiToken,
    marker: input.marker,
    dealBaseUrl: input.dealBaseUrl,
    market: input.market,
    origin: input.origin,
    destination: input.destination,
    departureAt: input.departureDate,
    returnAt: input.returnDate,
    directOnly: input.directOnly,
    limit: input.limit,
  });
  if (!exact.ok) return { ok: false, error: exact.error, status: exact.status };
  if (exact.offers.length > 0) {
    return { ok: true, offers: exact.offers, cacheTier: "exact" };
  }

  return {
    ok: true,
    offers: [],
    cacheTier: "none",
    emptyHint:
      "No cached Aviasales deal for these exact dates yet. Add KIWI_TEQUILA_API_KEY on the server for live Kiwi itineraries with exact deep links, or try other dates.",
  };
}
