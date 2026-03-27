"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AirportField } from "@/components/AirportField";

/** Avoids misleading "network error" when the server returns HTML (404) or invalid JSON. */
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
    return `${label}: not found (404). Deploy the latest code to Vercel — API routes may be missing.`;
  }
  if (status === 429) {
    return `${label}: too many requests. Wait a minute and try again.`;
  }
  const hint = raw.replace(/\s+/g, " ").trim().slice(0, 160);
  return `${label} failed (${status}).${hint ? ` ${hint}` : ""}`;
}

/**
 * Travelpayouts data API: cached deals per route/dates + referral link per row (no Flight Search API).
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
      const dealRes = await fetch("/api/deal-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });
      const dealRead = await readApiJson(dealRes);
      const dealJson = dealRead.json;
      if (!dealRes.ok || !dealJson?.ok) {
        setError(apiErrorMessage("Flight deals", dealRead.status, dealJson, dealRead.raw));
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
              ? (dealJson.affiliateFallback as {
                  url: string;
                  title: string;
                  body: string;
                })
              : undefined,
          meta: {
            origin,
            destination,
            departureDate,
            returnDate: trip === "round" ? returnDate : null,
          },
        }),
      );
      router.push("/flight-results");
    } catch (err) {
      console.error("[FlightSearchForm]", err);
      setError("Could not reach the server. Check your connection or try again.");
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
        {busy ? "Loading deals…" : "Find deals"}
      </button>
    </form>
  );
}
