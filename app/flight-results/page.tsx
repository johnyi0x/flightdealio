import Link from "next/link";
import { FlightResultsView } from "@/components/FlightResultsView";

/**
 * Displays the latest flight search from sessionStorage.
 */
export default function FlightResultsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Flight results</h1>
        <Link href="/" className="text-sm font-semibold text-sky-700 underline dark:text-sky-400">
          New search
        </Link>
      </div>
      <FlightResultsView />
    </div>
  );
}
