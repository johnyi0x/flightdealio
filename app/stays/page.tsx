import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FlightDealio — Stays & hotels",
  description:
    "Find hotels for your destination after you search flights on FlightDealio. Stay options open in a new tab with partner hotel results.",
};

export default function StaysPage() {
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
              Stay where you land
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Hotel and stay options appear with your live flight results — for the same
              destination you just searched.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/20 bg-white p-5 shadow-search sm:p-7 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              How to find stays
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Search a flight on FlightDealio. On the results page, stay suggestions for your
              destination show alongside the fares. Open one and a new tab loads hotel search
              results for that city through our booking partner.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Search flights to see stays
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-3xl gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {[
          {
            title: "Search your flight",
            body: "Enter cities, dates, and travelers — same search you already use for flights.",
          },
          {
            title: "See stay options",
            body: "Hotel suggestions for your destination appear with the live flight results.",
          },
          {
            title: "Compare and book",
            body: "A new tab opens partner hotel results so you can pick a stay and finish booking.",
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
