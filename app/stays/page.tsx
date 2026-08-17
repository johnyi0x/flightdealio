import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FlightDealio — Stays & hotels",
  description:
    "Find hotels for your destination on FlightDealio. Search your flight, then on the results page check Show hotels and press Search to open partner hotel results in a new tab.",
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
              Hotel search is built into the live flight results page. Two quick steps to see
              stays for your destination.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/20 bg-white p-5 shadow-search sm:p-7 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              How to find hotels
            </p>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Search a flight from this site.
                </span>{" "}
                Enter your route and dates on the homepage and press Search flights. You land on
                the live flight results page.
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  On the results page, check Show hotels.
                </span>{" "}
                The live search form at the top of that page has a{" "}
                <span className="font-semibold">Show hotels</span> checkbox. Tick it.
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Press Search again on that page.
                </span>{" "}
                Flights stay in the current tab. Hotel results for the same destination open in a{" "}
                <span className="font-semibold">new tab</span>.
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Compare and book.
                </span>{" "}
                The hotel tab can be Booking.com, Expedia, or another partner depending on your
                destination.
              </li>
            </ol>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <strong>Note:</strong> The main search form on this page finds flights only. Show
              hotels is on the live results page — not the homepage form.
            </div>

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
            title: "Step 1 — Search flights",
            body: "Enter route and dates on the homepage. You land on live flight results.",
          },
          {
            title: "Step 2 — Check Show hotels",
            body: "Tick Show hotels on the live results form, then press Search on that page.",
          },
          {
            title: "Step 3 — Book in a new tab",
            body: "Hotels for your destination open separately — Booking.com, Expedia, or another partner.",
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
