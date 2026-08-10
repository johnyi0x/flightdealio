"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import { AirportField } from "@/components/AirportField";
import { buildWhiteLabelSearchUrl } from "@/lib/whiteLabel";

function openNativeDatePicker(e: MouseEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  try {
    // Opens calendar when clicking the mm/dd/yyyy text, not only the icon
    el.showPicker?.();
  } catch {
    // Unsupported / already open — ignore
  }
}

const dateInputClass =
  "w-full min-h-[2.25rem] cursor-pointer border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100";

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

    let flightSearch = "";
    try {
      flightSearch = new URL(wlUrl).searchParams.get("flightSearch") || "";
    } catch {
      setError("Could not build search link.");
      return;
    }
    if (!flightSearch) {
      setError("Could not build search link.");
      return;
    }

    setBusy(true);
    // Bridge only with a real search — Ads conversion requires flightSearch=
    window.location.assign(
      `/live-search?flightSearch=${encodeURIComponent(flightSearch)}`,
    );
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-search dark:border-slate-700 dark:bg-slate-900">
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

          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex flex-1 border-b border-slate-100 dark:border-slate-800 lg:border-b-0 lg:border-r">
              <label className="flex min-w-0 flex-1 flex-col border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:border-b-0 sm:border-r sm:px-5 sm:py-5 lg:min-w-[10rem]">
                <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Depart
                </span>
                <input
                  name="departureDate"
                  type="date"
                  required
                  onClick={openNativeDatePicker}
                  className={dateInputClass}
                />
              </label>
              {trip === "round" && (
                <label className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5 lg:min-w-[10rem]">
                  <span className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Return
                  </span>
                  <input
                    name="returnDate"
                    type="date"
                    required
                    onClick={openNativeDatePicker}
                    className={dateInputClass}
                  />
                </label>
              )}
            </div>

            <label className="flex flex-col justify-center border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5 lg:w-36 lg:shrink-0 lg:border-b-0 lg:border-r">
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

            <div className="flex w-full shrink-0 p-3 lg:w-auto lg:items-stretch lg:self-stretch lg:p-3 lg:pl-2">
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 lg:min-w-[8rem] lg:self-center lg:px-6 lg:py-5"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Searching…
                  </span>
                ) : (
                  "Search flights"
                )}
              </button>
            </div>
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
