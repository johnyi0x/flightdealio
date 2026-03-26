"use client";

import { useMemo } from "react";
import { AirportField } from "@/components/AirportField";

/**
 * Budget explorer form: GET to `/results` with query params (bookmarkable).
 */
export function SearchForm() {
  const defaultMonth = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const monthOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const start = new Date();
    for (let i = 0; i < 18; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const value = `${y}-${m}`;
      out.push({
        value,
        label: d.toLocaleString(undefined, { month: "long", year: "numeric" }),
      });
    }
    return out;
  }, []);

  return (
    <form
      action="/results"
      method="get"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AirportField name="origin" label="Home airport / city" required />
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Max flight spend (USD)
          </span>
          <input
            name="budget"
            type="number"
            inputMode="numeric"
            min={200}
            max={50000}
            step={10}
            defaultValue={1200}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Round-trip flight must be under this amount.
          </span>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-800 dark:text-slate-200">Nights away</span>
          <input
            name="nights"
            type="number"
            inputMode="numeric"
            min={1}
            max={21}
            defaultValue={5}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sets the return date (outbound on the 15th of the month you pick).
          </span>
        </label>

        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-800 dark:text-slate-200">Planning month</span>
          <select
            name="month"
            defaultValue={defaultMonth}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Outbound uses the 15th of this month; return adds your nights.
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto"
      >
        Show destinations
      </button>
    </form>
  );
}
