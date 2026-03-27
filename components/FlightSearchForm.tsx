"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AirportField } from "@/components/AirportField";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Travelpayouts search: start → poll (client loop, avoids Vercel 10s timeout) → compile offers.
 */
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
      setError("Choose both airports from the suggestions (3-letter codes).");
      return;
    }

    const searchPayload = {
      origin,
      destination,
      departureDate,
      returnDate: trip === "round" ? returnDate : null,
      directOnly,
      cabinClass,
    };

    setBusy(true);
    try {
      const startRes = await fetch("/api/flight-search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });
      const startJson = (await startRes.json()) as {
        ok?: boolean;
        searchId?: string;
        error?: string;
      };
      if (!startRes.ok || !startJson.ok || !startJson.searchId) {
        setError(startJson.error || "Could not start flight search.");
        return;
      }

      const searchId = startJson.searchId;
      const accumulated: unknown[] = [];
      let terminal = false;
      const maxPolls = 90;

      await sleep(800);

      for (let i = 0; i < maxPolls && !terminal; i++) {
        const pollRes = await fetch(
          `/api/flight-search/poll?uuid=${encodeURIComponent(searchId)}`,
          { cache: "no-store" },
        );
        const pollJson = (await pollRes.json()) as {
          ok?: boolean;
          items?: unknown[];
          terminal?: boolean;
          error?: string;
        };
        if (!pollRes.ok || !pollJson.ok) {
          setError(pollJson.error || "Lost connection while loading results.");
          return;
        }
        for (const row of pollJson.items ?? []) {
          accumulated.push(row);
        }
        terminal = Boolean(pollJson.terminal);
        if (!terminal) await sleep(1000);
      }

      const compileRes = await fetch("/api/flight-search/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchId,
          accumulated,
          directOnly,
          cabinClass,
        }),
      });
      const json = (await compileRes.json()) as {
        ok?: boolean;
        error?: string;
        offers?: unknown;
        emptyHint?: string;
      };
      if (!compileRes.ok || !json.ok) {
        setError(json.error || "Could not build search results.");
        return;
      }

      sessionStorage.setItem(
        "flight_search_payload",
        JSON.stringify({
          offers: json.offers ?? [],
          source: "travelpayouts" as const,
          emptyHint: json.emptyHint,
          meta: {
            origin,
            destination,
            departureDate,
            returnDate: trip === "round" ? returnDate : null,
          },
        }),
      );
      router.push("/flight-results");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="tripTypeUi"
            checked={trip === "round"}
            onChange={() => setTrip("round")}
          />
          Round trip
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="tripTypeUi"
            checked={trip === "one"}
            onChange={() => setTrip("one")}
          />
          One way
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AirportField name="origin" label="From" required />
        <AirportField name="destination" label="To" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">Departure</span>
          <input
            name="departureDate"
            type="date"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        {trip === "round" ? (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-800 dark:text-slate-200">Return</span>
            <input
              name="returnDate"
              type="date"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        ) : (
          <div />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">Cabin</span>
          <select
            name="cabinClass"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            defaultValue="economy"
          >
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </label>
        <label className="mt-6 flex items-center gap-2 text-sm sm:mt-8">
          <input type="checkbox" name="directOnly" className="rounded border-slate-300" />
          <span className="text-slate-800 dark:text-slate-200">Direct flights only</span>
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Searching partners…" : "Search flights"}
      </button>
    </form>
  );
}
