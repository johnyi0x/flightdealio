import { airlineName } from "@/lib/airlines";
import { convertToUsd } from "@/lib/fx";
import type {
  FlightOfferPublic,
  FlightSegmentPublic,
  FlightSeller,
  FlightSlicePublic,
} from "@/lib/flightTypes";
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
      airlineName: airlineName(carrier, airlines[carrier]?.name),
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
    // Do not send x-access-token here — flight_search is signed with MD5 only; extra headers can trigger 403.
    initRes = await fetch(FLIGHT_SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "FlightFinder/1.0 (+https://travelpayouts.com)",
      },
      body: JSON.stringify(postBody),
    });
  } catch (e) {
    console.error("[Travelpayouts] flight_search network error", e);
    return { ok: false, error: "Could not reach flight search. Check your connection.", status: 502 };
  }

  const rawText = await initRes.text();
  let initJson: { search_id?: string; error?: string } | null = null;
  try {
    initJson = JSON.parse(rawText) as { search_id?: string; error?: string };
  } catch {
    initJson = null;
  }

  if (!initJson) {
    console.warn(
      "[Travelpayouts] flight_search non-JSON",
      initRes.status,
      "host=" + input.host,
      rawText.slice(0, 300),
    );
    if (initRes.status === 403 || initRes.status === 401) {
      return {
        ok: false,
        error:
          "Travelpayouts blocked flight search (HTTP " +
          initRes.status +
          "). The real-time Flight Search API is separate from the data token: request access in your Travelpayouts dashboard / support, and ensure TRAVELPAYOUTS_API_TOKEN and NEXT_PUBLIC_TRAVELPAYOUTS_MARKER match the API page. Your site host must match the domain you verified with Travelpayouts.",
        status: initRes.status,
      };
    }
    return {
      ok: false,
      error:
        "Travelpayouts returned a non-JSON response (" +
        initRes.status +
        "). Check Vercel function logs; often this is access denied or a proxy page.",
      status: 502,
    };
  }

  if (!initRes.ok || !initJson.search_id) {
    console.warn("[Travelpayouts] flight_search failed", initRes.status, "host=" + input.host, initJson);
    const msg =
      initJson.error ||
      (initRes.status === 401 || initRes.status === 403
        ? "Travelpayouts denied access (HTTP " +
          initRes.status +
          "). Confirm Flight Search API is enabled for your account, token and marker are from the same Travelpayouts API page, and the `host` header matches your verified website."
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

    // One proposal = one itinerary. Each gate (term) is a different SELLER of it.
    const sellers: FlightSeller[] = [];
    for (const [gateId, t] of Object.entries(terms)) {
      const price = typeof t.unified_price === "number" ? t.unified_price : Number(t.price);
      const termsUrl = t.url;
      if (!Number.isFinite(price) || typeof termsUrl !== "number") continue;

      const totalUsd = await convertToUsd(price, (t.currency || "usd").toString());
      if (totalUsd === null) continue;

      sellers.push({
        name: gateLabel(gatesInfo, gateId),
        totalUsd: Math.round(totalUsd * 100) / 100,
        totalCurrency: "USD",
        travelpayoutsClick: { searchId: input.searchId, termsUrl },
      });
    }

    if (sellers.length === 0) continue;
    sellers.sort((a, b) => a.totalUsd - b.totalUsd);

    const id = proposal.sign
      ? `prop-${proposal.sign}-${out.length}`
      : `${input.searchId}-${out.length}`;

    out.push({
      id,
      slices,
      sellers,
      cheapestUsd: sellers[0]!.totalUsd,
      totalCurrency: "USD",
      dateTier: "exact",
    });
  }

  out.sort((a, b) => a.cheapestUsd - b.cheapestUsd);
  return out.slice(0, input.limit);
}
