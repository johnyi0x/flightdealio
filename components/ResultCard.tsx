import type { PublicDestinationResult } from "@/lib/budgetSearch";
import { ValueScoreBadge } from "@/components/ValueScoreBadge";

/**
 * Budget explorer card: flight quote under your cap, value badge, Kiwi deep link
 * with the same outbound/return dates used for the Duffel search.
 */
export function ResultCard({
  row,
  budgetUsd,
}: {
  row: PublicDestinationResult;
  budgetUsd: number;
}) {
  const headroomUsd = Math.max(0, budgetUsd - row.flightUsd);

  return (
    <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {row.destinationLabel}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            City code {row.destinationCityCode}
          </p>
        </div>
        <ValueScoreBadge score={row.valueScore} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Round-trip flight</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">
            ${row.flightUsd.toFixed(0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Budget headroom</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">
            ${headroomUsd.toFixed(0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Your budget</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">
            ${budgetUsd.toFixed(0)}
          </dd>
        </div>
      </dl>

      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {row.dealExplanation}
      </p>

      <div className="space-y-1">
        <a
          href={row.affiliateFlightsUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto"
        >
          Search on Kiwi.com
        </a>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Opens Kiwi with these dates; fare may differ from the estimate above.
        </p>
      </div>
    </article>
  );
}
