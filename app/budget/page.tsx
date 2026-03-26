import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

/**
 * Budget trip explorer (sampled destinations under a total budget cap).
 */
export default function BudgetPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Budget trip explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Start from a budget and a home airport—we sample major hubs and rank round-trip flight quotes
            that fit under your cap.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Standard flight search
        </Link>
      </div>

      <SearchForm />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Results open on <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/results</code> after
        you submit.
      </p>
    </div>
  );
}
