import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FlightDealio — Stays & hotels",
  description:
    "Find hotels for your destination on FlightDealio. Search flights, then check Show hotels on live results and press Search to open partner hotel results in a new tab.",
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
            <p className="max-w-2xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Stays are tied to a live flight search. The first results page shows flights; hotels
              open in a new tab after you search again with Show hotels turned on.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/20 bg-white p-5 shadow-search sm:p-7 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              How stays work
            </p>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                Start on the FlightDealio homepage. Enter from/to, dates, travelers, and cabin,
                then press Search flights. That opens live flight deals for your route.
              </li>
              <li>
                On that live results page, the search form includes a{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Show hotels
                </span>{" "}
                option. Leave it checked (we turn it on for you when the form loads).
              </li>
              <li>
                Press{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">Search</span>{" "}
                again on that page. Flights stay on this tab. Stays open in a{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">new tab</span>{" "}
                with hotel results for the same destination and dates.
              </li>
              <li>
                The hotel site can be Booking.com, Expedia, or another partner — it depends on
                your destination. Finish booking on that partner site.
              </li>
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Searching only from the homepage shows flights first. Show hotels is a live-results
              form option, so the stay tab opens when you search from that page — not from the
              first homepage click.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Start with a flight search
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-3xl gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {[
          {
            title: "Search flights",
            body: "Use the homepage form. You land on live fares for your route and dates.",
          },
          {
            title: "Keep Show hotels on",
            body: "On the live results form, leave Show hotels checked, then press Search.",
          },
          {
            title: "Book in a new tab",
            body: "Hotel results open separately for that destination — Booking.com, Expedia, or another partner.",
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
