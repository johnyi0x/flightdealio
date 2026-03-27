import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          <strong>Aviasales</strong> rows use Travelpayouts data cache for your <strong>exact dates</strong>; each Book
          link is the API deal URL with your marker. If the cache is empty, configure a server{" "}
          <strong>Duffel</strong> token for live offers and <strong>Kiwi.com</strong> deep links (same Travelpayouts
          marker as <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">affilid</code>). Use{" "}
          <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
