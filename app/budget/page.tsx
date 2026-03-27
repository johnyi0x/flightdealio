import Link from "next/link";

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Budget explorer
        </h1>
        <Link
          href="/"
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Flight search
        </Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <p className="leading-relaxed">
          This tool is being rebuilt for the same Travelpayouts flight pipeline as the main search, so budget
          browsing and book links stay consistent. Use{" "}
          <Link href="/" className="font-semibold text-sky-700 underline dark:text-sky-400">
            Flights
          </Link>{" "}
          for real-time partner fares and per-partner booking buttons.
        </p>
      </div>
    </div>
  );
}
