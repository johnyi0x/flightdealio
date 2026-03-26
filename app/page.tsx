import Link from "next/link";
import { FlightSearchForm } from "@/components/FlightSearchForm";

/**
 * Primary experience: classic origin / destination / date flight search powered by Duffel.
 */
export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Search real flights
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Pick airports by typing a city name, choose dates, and we pull live offers from Duffel with
          airline, flight number, and aircraft when the carrier provides them. Use{" "}
          <strong>direct only</strong> for a stricter search, or open{" "}
          <Link className="font-semibold text-sky-700 underline dark:text-sky-400" href="/budget">
            Budget trip explorer
          </Link>{" "}
          if you want inspiration under a fixed budget.
        </p>
      </div>

      <FlightSearchForm />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:text-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Deploy checklist</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">DUFFEL_ACCESS_TOKEN</code> in{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.local</code> (test → live when
            approved).
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">NEXT_PUBLIC_TRAVELPAYOUTS_MARKER</code>{" "}
            from Travelpayouts (Kiwi program) so Kiwi deep links earn commission.
          </li>
          <li>
            Push to GitHub → import in Vercel → copy the same env vars → production deploy.
          </li>
        </ol>
      </section>
    </div>
  );
}
