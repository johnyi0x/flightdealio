import { FlightSearchForm } from "@/components/FlightSearchForm";
import { WHITELABEL_BASE_URL } from "@/lib/whiteLabel";

export default function HomePage() {
  return (
    <div className="-mx-4 sm:mx-0">
      <section className="relative overflow-hidden bg-gradient-to-br from-hero via-brand-900 to-hero-dark px-4 pb-10 pt-8 sm:rounded-2xl sm:px-8 sm:pb-12 sm:pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl space-y-6">
          <div className="space-y-3">
            <p className="text-lg font-black tracking-tight text-white sm:text-2xl">
              FlightDealio
            </p>
            <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Search live flights. Compare. Book with partners.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Start your search here. We open live fares on FlightDealio&apos;s partner search —
              then you finish booking on the seller&apos;s site.
            </p>
          </div>

          <FlightSearchForm />
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-3xl gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {[
          {
            title: "Search on FlightDealio",
            body: "Enter your trip on this page — results load on our live search.",
          },
          {
            title: "Live partner fares",
            body: "See current prices from Aviasales-powered metasearch, not stale cache.",
          },
          {
            title: "Book where you choose",
            body: "Checkout stays on the partner site. FlightDealio earns when you book.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.body}</p>
          </div>
        ))}
      </section>

      <p className="mx-auto mt-6 max-w-3xl px-4 text-center text-xs text-slate-500 dark:text-slate-400 sm:px-0">
        Live search:{" "}
        <a
          href="/live-search"
          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          flightdealio.com/live-search
        </a>
        {" → "}
        <a
          href={WHITELABEL_BASE_URL}
          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {WHITELABEL_BASE_URL.replace(/^https?:\/\//, "")}
        </a>
      </p>
    </div>
  );
}
