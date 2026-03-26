"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ResultCard } from "@/components/ResultCard";
import type { PublicDestinationResult } from "@/lib/budgetSearch";

type ApiOk = { ok: true; results: PublicDestinationResult[]; warnings: string[] };
type ApiErr = { ok: false; error: string };
type ApiResponse = ApiOk | ApiErr;

/**
 * Reads the same query params as the GET form, calls our server route, and
 * renders either helpful errors or the ranked cards.
 */
export function ResultsView() {
  const searchParams = useSearchParams();
  const query = useMemo(() => searchParams.toString(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setPayload(null);
      try {
        const res = await fetch(`/api/search?${query}`, { method: "GET" });
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setPayload(json);
      } catch {
        if (!cancelled) {
          setPayload({ ok: false, error: "Network error. Please check your connection and try again." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!query) {
      setLoading(false);
      setPayload({ ok: false, error: "Missing search parameters. Start again from the home page." });
      return;
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const budgetUsd = Number(searchParams.get("budget"));

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading results…
      </div>
    );
  }

  if (!payload) {
    return null;
  }

  if (!payload.ok) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
        {payload.error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payload.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-semibold">Heads up</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {payload.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {payload.results.map((row) => (
          <ResultCard key={`${row.destinationCityCode}-${row.flightUsd}`} row={row} budgetUsd={budgetUsd} />
        ))}
      </div>
    </div>
  );
}
