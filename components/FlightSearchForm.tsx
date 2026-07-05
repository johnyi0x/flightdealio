"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AirportField } from "@/components/AirportField";
import type { FlightOfferPublic } from "@/lib/flightTypes";

async function readApiJson(res: Response): Promise<{
  status: number;
  json: Record<string, unknown> | null;
  raw: string;
}> {
  const raw = await res.text();
  try {
    return { status: res.status, json: JSON.parse(raw) as Record<string, unknown>, raw };
  } catch {
    return { status: res.status, json: null, raw };
  }
}

function apiErrorMessage(
  label: string,
  status: number,
  json: Record<string, unknown> | null,
  raw: string,
): string {
  const msg = typeof json?.error === "string" ? json.error : null;
  if (msg) return msg;
  if (status === 404) {
    return `${label}: not found (404). Deploy the latest code to Vercel.`;
  }
  if (status === 429) {
    return `${label}: too many requests. Wait a minute and try again.`;
  }
  const hint = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  return `${label} failed (${status}).${hint ? ` ${hint}` : ""}`;
}

type SearchInput = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  directOnly: boolean;
  cabinClass: string;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tryLiveSearch(input: SearchInput): Promise<FlightOfferPublic[] | null> {
  const startRes = await fetch("/api/flight-search/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const start = await readApiJson(startRes);
  const searchId =
    start.json && typeof start.json.searchId === "string" ? start.json.searchId : "";
  if (!startRes.ok || !start.json?.ok || !searchId) return null;

  const accumulated: unknown[] = [];
  let terminal = false;
  for (let round = 0; round < 6 && !terminal; round++) {
    const pollRes = await fetch(
      `/api/flight-search/batch-poll?uuid=${encodeURIComponent(searchId)}`,
      { cache: "no-store" },
    );
    const poll = await readApiJson(pollRes);
    if (pollRes.ok && poll.json?.ok && Array.isArray(poll.json.items)) {
      accumulated.push(...(poll.json.items as unknown[]));
      terminal = Boolean(poll.json.terminal);
    }
    if (!terminal) await delay(600);
  }

  const trimmed = accumulated.slice(-400);
  const compileRes = await fetch("/api/flight-search/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      searchId,
      accumulated: trimmed,
      directOnly: input.directOnly,
      cabinClass: input.cabinClass,
    }),
  });
  const compile = await readApiJson(compileRes);
  if (!compileRes.ok || !compile.json?.ok) return null;
  const offers = Array.isArray(compile.json.offers)
    ? (compile.json.offers as FlightOfferPublic[])
    : [];
  return offers.length > 0 ? offers : null;
}


export function FlightSearchForm() {
  const router = useRouter();
  const [trip, setTrip] = useState<"round" | "one">("round");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origin = String(fd.get("origin") || "").trim().toUpperCase();
    const destination = String(fd.get("destination") || "").trim().toUpperCase();
    const departureDate = String(fd.get("departureDate") || "").trim();
    const returnDate =
      trip === "round" ? String(fd.get("returnDate") || "").trim() : "";
    const directOnly = fd.get("directOnly") === "on";
    const cabinClass = String(fd.get("cabinClass") || "economy");

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      setError("Pick both airports from the suggestions list.");
      return;
    }

    const searchPayload: SearchInput = {
      origin,
      destination,
      departureDate,
      returnDate: trip === "round" ? returnDate : null,
      directOnly,
      cabinClass,
    };

    const meta = {
      origin,
      destination,
      departureDate,
      returnDate: trip === "round" ? returnDate : null,
      cabinClass,
      directOnly,
    };

    setBusy(true);
    try {
      let liveOffers: FlightOfferPublic[] | null = null;
      try {
        liveOffers = await tryLiveSearch(searchPayload);
      } catch (err) {
        console.warn("[FlightSearchForm] live search failed", err);
      }

      if (liveOffers && liveOffers.length > 0) {
        sessionStorage.setItem(
          "flight_search_payload",
          JSON.stringify({ offers: liveOffers, source: "travelpayouts", meta }),
        );
        router.push("/flight-results");
        return;
      }

      const dealRes = await fetch("/api/deal-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });
      const dealRead = await readApiJson(dealRes);
      const dealJson = dealRead.json;
      if (!dealRes.ok || !dealJson?.ok) {
        setError(apiErrorMessage("Flight search", dealRead.status, dealJson, dealRead.raw));
        return;
      }

      const src = dealJson.source;
      const source: "travelpayouts_data" | "kiwi_tequila" =
        src === "kiwi_tequila" ? "kiwi_tequila" : "travelpayouts_data";

      sessionStorage.setItem(
        "flight_search_payload",
        JSON.stringify({
          offers: dealJson.offers ?? [],
          source,
          emptyHint: typeof dealJson.emptyHint === "string" ? dealJson.emptyHint : undefined,
          dealDisclaimer:
            typeof dealJson.dealDisclaimer === "string" ? dealJson.dealDisclaimer : undefined,
          kiwiDisclaimer:
            typeof dealJson.kiwiDisclaimer === "string" ? dealJson.kiwiDisclaimer : undefined,
          affiliateFallback:
            dealJson.affiliateFallback &&
            typeof dealJson.affiliateFallback === "object" &&
            dealJson.affiliateFallback !== null
              ? (dealJson.affiliateFallback as { url: string; title: string; body: string })
              : undefined,
          meta,
        }),
      );
      router.push("/flight-results");
    } catch (err) {
      console.error("[FlightSearchForm]", err);
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Trip type + options row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
          {(["round", "one"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrip(t)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm",
                trip === t
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              ].join(" ")}
            >
              {t === "round" ? "Round-trip" : "One-way"}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            name="directOnly"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs sm:text-sm">Direct flights only</span>
        </label>
      </div>

      {/* Unified search bar — desktop horizontal, mobile stacked */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-search dark:border-slate-700 dark:bg-slate-900">
        {/* Row 1: airports */}
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col border-b border-slate-100 px-4 py-3 dark:border-slate-800 md:flex-row md:items-center md:gap-4 md:border-b-0 md:border-r md:py-4">
            <AirportField
              name="origin"
              label="From"
              required
              variant="compact"
              placeholder="City or airport"
            />
            <AirportField
              name="destination"
              label="To"
              required
              variant="compact"
              placeholder="City or airport"
            />
          </div>

          {/* Row 2 on mobile / right section on desktop: dates + cabin */}
          <div className="flex flex-col sm:flex-row md:shrink-0">
            <div className="flex flex-1 border-b border-slate-100 dark:border-slate-800 sm:border-b-0 sm:border-r">
              <label className="flex flex-1 flex-col border-r border-slate-100 px-4 py-3 dark:border-slate-800 md:py-4">
                <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Depart
                </span>
                <input
                  name="departureDate"
                  type="date"
                  required
                  className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                />
              </label>
              {trip === "round" && (
                <label className="flex flex-1 flex-col px-4 py-3 md:py-4">
                  <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Return
                  </span>
                  <input
                    name="returnDate"
                    type="date"
                    required
                    className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
                  />
                </label>
              )}
            </div>

            <label className="flex flex-col justify-center border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:w-36 sm:border-b-0 md:py-4">
              <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cabin
              </span>
              <select
                name="cabinClass"
                defaultValue="economy"
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none dark:text-slate-100"
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </label>
          </div>

          {/* Search button */}
          <div className="flex items-stretch p-3 md:p-2">
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 md:w-auto md:min-w-[120px] md:self-center md:rounded-xl md:py-4"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Searching…
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      )}
    </form>
  );
}
