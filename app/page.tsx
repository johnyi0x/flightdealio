import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Search a route and compare prices from multiple sellers for the same flight, on one page. We try a live
          multi-seller search first; if nothing comes back for your exact dates, we show the closest cached deals
          (clearly labelled) so you still have options. You book on the seller&rsquo;s site. Use{" "}
          <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
