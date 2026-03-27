import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          <strong>Travelpayouts</strong> first: exact dates, then ±7 days for the same trip — each priced row is a real
          Aviasales deal link with your marker. If nothing is cached, you still get an{" "}
          <strong>affiliate Kiwi search</strong> button (no API key). Optional{" "}
          <strong>KIWI_TEQUILA_API_KEY</strong> adds exact Kiwi deep links when Kiwi approves your partner account. Use{" "}
          <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
