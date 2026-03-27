import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Search flights
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Compare prices from multiple booking partners for the same trip. Each row shows one partner&apos;s
          fare — use <strong>Book on …</strong> to open that partner&apos;s offer (with referral).
          Use <strong>direct only</strong> to restrict to nonstop flights.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
