import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          We use <strong>Travelpayouts</strong> cached Aviasales deals when available (exact deal link + your marker).
          If there is no cache for your dates, add <strong>KIWI_TEQUILA_API_KEY</strong> on the server — we then search{" "}
          <strong>Kiwi’s Tequila API</strong> and each row gets that itinerary&apos;s real{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">deep_link</code> (not a generic
          search page), plus Travelpayouts click tracking and your marker as <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">affilid</code>. Use{" "}
          <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
