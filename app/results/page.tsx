import { Suspense } from "react";
import Link from "next/link";
import { ResultsView } from "@/components/ResultsView";

/**
 * Thin page shell: suspense boundary is required for `useSearchParams` usage.
 */
export default function ResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Budget explorer results
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-sky-700 underline dark:text-sky-400"
          >
            Flight search
          </Link>
          <Link
            href="/budget"
            className="text-sm font-semibold text-slate-700 underline dark:text-slate-300"
          >
            Edit budget search
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Loading your parameters…
          </div>
        }
      >
        <ResultsView />
      </Suspense>
    </div>
  );
}
