import { FlightResultsView } from "@/components/FlightResultsView";

export default function FlightResultsPage() {
  return (
    <div className="space-y-5">
      <h1 className="sr-only">Flight results</h1>
      <FlightResultsView />
    </div>
  );
}
