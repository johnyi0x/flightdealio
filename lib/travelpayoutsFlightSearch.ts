import { convertToUsd } from "@/lib/fx";
import type { FlightOfferPublic, FlightSegmentPublic, FlightSlicePublic } from "@/lib/flightTypes";
import { travelpayoutsFlightSearchSignature } from "@/lib/travelpayoutsSignature";

export const FLIGHT_SEARCH = "https://api.travelpayouts.com/v1/flight_search";
export const FLIGHT_SEARCH_RESULTS = "https://api.travelpayouts.com/v1/flight_search_results";

export type TravelpayoutsCabin = "economy" | "premium_economy" | "business" | "first";

type TpTerm = {
  price?: number;
  unified_price?: number;
  currency?: string;
  url?: number;
};

type TpFlightLeg = {
  departure?: string;
  arrival?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  operating_carrier?: string;
  number?: number;
  aircraft?: string;
  local_departure_timestamp?: number;
  local_arrival_timestamp?: number;
};

type TpProposal = {
  sign?: string;
  is_direct?: boolean;
  max_stops?: number;
  terms?: Record<string, TpTerm>;
  segment?: Array<{ flight?: TpFlightLeg[] }>;
};

type TpChunk = {
  proposals?: TpProposal[];
  airports?: Record<string, { name?: string; city?: string }>;
  airlines?: Record<string, { name?: string }>;
  gates_info?: Record<string, { label?: string }>;
  search_id?: string;
  meta?: unknown;
};

function cabinToTripClass(cabin: TravelpayoutsCabin): "Y" | "C" {
  if (cabin === "business" || cabin === "first") return "C";
  return "Y";
}

function passesDirectFilter(directOnly: boolean, proposal: TpProposal): boolean {
  if (!directOnly) return true;
  if (proposal.is_direct === true) return true;
  if (proposal.max_stops === 0) return true;
  return false;
}

function isoFromLocalParts(date?: string, time?: string): string {
  if (!date) return "";
  const t = time && /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : "12:00:00";
  return `${date}T${t}`;
}

function mapSlice(
  slice: { flight?: TpFlightLeg[] },
  airports: Record<string, { name?: string; city?: string }>,
  airlines: Record<string, { name?: string }>,
): FlightSlicePublic | null {
  const segments: FlightSegmentPublic[] = [];
  for (const f of slice.flight ?? []) {
    const dep = (f.departure || "").toUpperCase();
    const arr = (f.arrival || "").toUpperCase();
    if (!dep || !arr) continue;
    const carrier = (f.operating_carrier || "").toUpperCase();
    const departsAt =
      typeof f.local_departure_timestamp === "number"
        ? new Date(f.local_departure_timestamp * 1000).toISOString()
        : isoFromLocalParts(f.departure_date, f.departure_time);
    const arrivesAt =
      typeof f.local_arrival_timestamp === "number"
        ? new Date(f.local_arrival_timestamp * 1000).toISOString()
        : isoFromLocalParts(f.arrival_date, f.arrival_time);

    segments.push({
      originCode: dep,
      originName: airports[dep]?.name || airports[dep]?.city || dep,
      destCode: arr,
      destName: airports[arr]?.name || airports[arr]?.city || arr,
      departsAt,
      arrivesAt,
      airlineName: (carrier && airlines[carrier]?.name) || carrier || "Airline",
      airlineIata: carrier || undefined,
      flightNumber: f.number != null ? String(f.number) : "",
      aircraftName: f.aircraft,
    });
  }
  if (segments.length === 0) return null;
  return { segments };
}

function bestResultsChunk(accumulated: unknown[]): TpChunk | null {
  let best: TpChunk | null = null;
  let n = 0;
  for (const item of accumulated) {
    if (!item || typeof item !== "object") continue;
    const c = item as TpChunk;
    const len = Array.isArray(c.proposals) ? c.proposals.length : 0;
    if (len > n) {
      best = c;
      n = len;
    }
  }
  return best;
}

function gateLabel(gatesInfo: Record<string, { label?: string }> | undefined, gateId: string): string {
  const raw = gatesInfo?.[gateId]?.label?.trim();
  if (raw) return raw;
  return `Partner ${gateId}`;
}

function buildSegmentsForProposal(
  proposal: TpProposal,
  airports: Record<string, { name?: string; city?: string }>,
  airlines: Record<string, { name?: string }>,
): FlightSlicePublic[] {
  const slices: FlightSlicePublic[] = [];
  for (const seg of proposal.segment ?? []) {
    const sl = mapSlice(seg, airports, airlines);
    if (sl) slices.push(sl);
  }
  return slices;
}

/**
 * Step 1: Start search (fast). Call from server; client polls separately to stay under Vercel time limits.
 */
export async function startTravelpayoutsFlightSearch(input: {
  apiToken: string;
  marker: string;
  host: string;
  userIp: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  cabinClass: TravelpayoutsCabin;
}): Promise<{ ok: true; searchId: string } | { ok: false; error: string; status?: number }> {
  const segments =
    input.returnDate && input.returnDate.length > 0
      ? [
          { origin: input.origin, destination: input.destination, date: input.departureDate },
          { origin: input.destination, destination: input.origin, date: input.returnDate },
        ]
      : [{ origin: input.origin, destination: input.destination, date: input.departureDate }];

  const bodyObj: Record<string, unknown> = {
    marker: input.marker,
    host: input.host,
    user_ip: input.userIp,
    locale: "en-us",
    trip_class: cabinToTripClass(input.cabinClass),
    passengers: { adults: 1, children: 0, infants: 0 },
    segments,
    know_english: "true",
    currency: "usd",
  };

  const signature = travelpayoutsFlightSearchSignature(input.apiToken, bodyObj);
  const postBody = { ...bodyObj, signature };

  let initRes: Response;
  try {
    initRes = await fetch(FLIGHT_SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-access-token": input.apiToken,
      },
      body: JSON.stringify(postBody),
    });
  } catch (e) {
    console.error("[Travelpayouts] flight_search network error", e);
    return { ok: false, error: "Could not reach flight search. Check your connection.", status: 502 };
  }

  let initJson: { search_id?: string; error?: string };
  try {
    initJson = (await initRes.json()) as { search_id?: string; error?: string };
  } catch {
    const t = await initRes.text().catch(() => "");
    console.warn("[Travelpayouts] flight_search non-JSON", initRes.status, t.slice(0, 200));
    return { ok: false, error: "Flight search returned an invalid response.", status: 502 };
  }

  if (!initRes.ok || !initJson.search_id) {
    console.warn("[Travelpayouts] flight_search failed", initRes.status, initJson);
    const msg =
      initJson.error ||
      (initRes.status === 401 || initRes.status === 403
        ? "Travelpayouts rejected the API token. Confirm TRAVELPAYOUTS_API_TOKEN and Search API access."
        : "Flight search could not start. Try again or contact support.");
    return { ok: false, error: msg, status: initRes.status >= 400 ? initRes.status : 502 };
  }

  return { ok: true, searchId: initJson.search_id };
}

/**
 * Step 2: One poll (fast). Client calls until `terminal` is true.
 */
export async function pollTravelpayoutsResultsBatch(
  searchId: string,
): Promise<{ ok: true; items: unknown[]; terminal: boolean } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(
      `${FLIGHT_SEARCH_RESULTS}?uuid=${encodeURIComponent(searchId)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
  } catch (e) {
    console.error("[Travelpayouts] poll network", e);
    return { ok: false, error: "Network error while loading results." };
  }

  let batch: unknown;
  try {
    batch = await res.json();
  } catch {
    return { ok: false, error: "Invalid results response." };
  }

  if (!res.ok) {
    return { ok: false, error: "Results request failed." };
  }

  if (!Array.isArray(batch) || batch.length === 0) {
    return { ok: true, items: [], terminal: false };
  }

  const last = batch[batch.length - 1];
  const terminal =
    last &&
    typeof last === "object" &&
    "search_id" in last &&
    !(last as TpChunk).meta;

  return { ok: true, items: batch, terminal: Boolean(terminal) };
}

/**
 * Step 3: Turn all polled chunks into bookable rows (server-side FX + mapping).
 */
export async function compileTravelpayoutsOffers(input: {
  searchId: string;
  accumulated: unknown[];
  directOnly: boolean;
  cabinClass: TravelpayoutsCabin;
  limit: number;
}): Promise<FlightOfferPublic[]> {
  const chunk = bestResultsChunk(input.accumulated);
  if (!chunk?.proposals?.length) {
    return [];
  }

  const airports = chunk.airports ?? {};
  const airlines = chunk.airlines ?? {};
  const gatesInfo = chunk.gates_info ?? {};
  const out: FlightOfferPublic[] = [];

  for (const proposal of chunk.proposals) {
    if (!passesDirectFilter(input.directOnly, proposal)) continue;
    const terms = proposal.terms;
    if (!terms || typeof terms !== "object") continue;

    const slices = buildSegmentsForProposal(proposal, airports, airlines);
    if (slices.length === 0) continue;

    for (const [gateId, t] of Object.entries(terms)) {
      const price = typeof t.unified_price === "number" ? t.unified_price : Number(t.price);
      const termsUrl = t.url;
      if (!Number.isFinite(price) || typeof termsUrl !== "number") continue;

      const totalUsd = await convertToUsd(price, (t.currency || "usd").toString());
      if (totalUsd === null) continue;

      const agencyName = gateLabel(gatesInfo, gateId);
      const id =
        proposal.sign && gateId
          ? `${proposal.sign}-${gateId}-${termsUrl}`
          : `${input.searchId}-${out.length}-${termsUrl}`;

      out.push({
        id,
        totalUsd: Math.round(totalUsd * 100) / 100,
        totalCurrency: "USD",
        slices,
        agencyName,
        travelpayoutsClick: { searchId: input.searchId, termsUrl },
      });
    }
  }

  out.sort((a, b) => a.totalUsd - b.totalUsd);
  return out.slice(0, input.limit);
}
