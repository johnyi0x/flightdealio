"use client";

import { useState, type FormEvent } from "react";
import { AirportField } from "@/components/AirportField";
import { buildWhiteLabelSearchUrl, WHITELABEL_BASE_URL } from "@/lib/whiteLabel";

export function FlightSearchForm() {
  const [trip, setTrip] = useState<"round" | "one">("round");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origin = String(fd.get("origin") || "").trim().toUpperCase();
    const destination = String(fd.get("destination") || "").trim().toUpperCase();
    const departureDate = String(fd.get("departureDate") || "").trim();
    const returnDate =
      trip === "round" ? String(fd.get("returnDate") || "").trim() : "";
    const cabinClass = String(fd.get("cabinClass") || "economy");

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      setError("Pick both airports from the suggestions list.");
      return;
    }
    if (trip === "round" && !returnDate) {
      setError("Choose a return date, or switch to One-way.");
      return;
    }

    const wlUrl = buildWhiteLabelSearchUrl({
      origin,
      destination,
      departureDate,
      returnDate: trip === "round" ? returnDate : null,
      cabinClass,
      adults: 1,
    });

    if (!wlUrl) {
      setError("Check your dates and try again.");
      return;
    }

    // Route via main-domain bridge so Google Ads can detect the conversion on
    // flightdealio.com/live-search, then redirect to White Label.
    let flightSearch = "";
    try {
      flightSearch = new URL(wlUrl).searchParams.get("flightSearch") || "";
    } catch {
      setError("Could not build search link.");
      return;
    }

    setBusy(true);
    const bridge = flightSearch
      ? `/live-search?flightSearch=${encodeURIComponent(flightSearch)}`
      : "/live-search";
    window.location.assign(bridge);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      </div>

      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-search dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col">
          <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 lg:flex-row">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 lg:flex-1 lg:border-b-0 lg:border-r lg:px-6 lg:py-5">
              <AirportField
                name="origin"
                label="From"
                required
                variant="compact"
                placeholder="City or airport"
              />
            </div>
            <div className="px-5 py-4 lg:flex-1 lg:px-6 lg:py-5">
              <AirportField
                name="destination"
                label="To"
                required
                variant="compact"
                placeholder="City or airport"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="flex flex-1 border-b border-slate-100 dark:border-slate-800 sm:border-b-0 sm:border-r">
              <label className="flex min-w-0 flex-1 flex-col border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:border-b-0 sm:border-r sm:px-5 sm:py-5 lg:min-w-[10rem]">
                <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Depart
                </span>
                <input
                  name="departureDate"
                  type="date"
                  required
                  className="w-full min-h-[2.25rem] border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100"
                />
              </label>
              {trip === "round" && (
                <label className="flex min-w-0 flex-1 flex-col px-5 py-4 sm:px-5 sm:py-5 lg:min-w-[10rem]">
                  <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Return
                  </span>
                  <input
                    name="returnDate"
                    type="date"
                    required
                    className="w-full min-h-[2.25rem] border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100"
                  />
                </label>
              )}
            </div>

            <label className="flex flex-col justify-center border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:w-36 sm:shrink-0 sm:border-b-0 sm:border-r sm:px-5 sm:py-5">
              <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cabin
              </span>
              <select
                name="cabinClass"
                defaultValue="economy"
                className="w-full min-h-[2.25rem] cursor-pointer border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100"
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </label>

            <div className="flex items-stretch p-4 sm:p-3 sm:pl-2">
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-8 py-4 text-sm font-bold text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 sm:min-w-[7.5rem] sm:self-center sm:py-5"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Opening…
                  </span>
                ) : (
                  "Search flights"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-sky-100/80 sm:text-left">
        Live results open on{" "}
        <span className="font-semibold text-white">flights.flightdealio.com</span>
        {" — "}
        FlightDealio search powered by our partners. Book on the seller you choose.
      </p>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      )}

      <p className="sr-only">White Label: {WHITELABEL_BASE_URL}</p>
    </form>
  );
}
