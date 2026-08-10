import type { Metadata } from "next";
import { TaxiTransferWidget } from "@/components/TaxiTransferWidget";

export const metadata: Metadata = {
  title: "FlightDealio — Airport transfers",
  description: "Search and book airport transfers and taxis on FlightDealio.",
};

export default function TaxiPage() {
  return (
    <div className="-mx-4 sm:mx-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-hero via-brand-900 to-hero-dark px-4 pb-10 pt-8 sm:rounded-2xl sm:px-8 sm:pb-12 sm:pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-5xl space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-black tracking-tight text-white sm:text-2xl">
              FlightDealio
            </p>
            <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Ride farther with FlightDealio
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Search airport transfers and taxis for your route, then book a ride that meets you
              where you land.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/20 bg-white p-3 shadow-search sm:p-5 dark:border-slate-700 dark:bg-slate-900">
            <TaxiTransferWidget />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-3xl gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {[
          {
            title: "Choose your route",
            body: "Enter pick-up and drop-off — city, airport, or train station.",
          },
          {
            title: "Book online",
            body: "Compare transfer options and reserve the ride that fits.",
          },
          {
            title: "Meet your driver",
            body: "Your driver meets you with a name plate and takes you to your destination.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {item.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
