import Link from "next/link";
import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Search flights
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Type a city or airport, pick dates, and compare options. Use <strong>direct only</strong> for
          nonstop flights. For ideas under a fixed budget, try the{" "}
          <Link className="font-semibold text-sky-700 underline dark:text-sky-400" href="/budget">
            budget explorer
          </Link>
          .
        </p>
      </div>

      <FlightSearchForm />
    </div>
  );
}
