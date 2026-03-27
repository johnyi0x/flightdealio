import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          We load <strong>cached deals</strong> from Travelpayouts data (recent Aviasales searches). Each row is
          a real fare with a <strong>Book on Aviasales</strong> link that includes your partner marker. Final
          price and availability are on the partner site. Use <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
