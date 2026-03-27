import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Find flight deals
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          We try <strong>Travelpayouts cached deals</strong> first (Aviasales links with your marker), then a{" "}
          <strong>month-wide cache</strong> if the exact day is empty. If there is still nothing, add{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">DUFFEL_ACCESS_TOKEN</code>{" "}
          on the server for <strong>live fares</strong> — each row then links to <strong>Kiwi.com</strong> with your
          Travelpayouts <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">affilid</code>.
          Use <strong>direct only</strong> for nonstop.
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
