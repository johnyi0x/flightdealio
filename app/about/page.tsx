import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About FlightDealio — Flight search & travel tools",
  description:
    "FlightDealio helps travelers search flights, compare partner fares, and book with the seller they choose. Also find rental cars, airport transfers, and travel eSIMs.",
  openGraph: {
    title: "About FlightDealio",
    description:
      "Search flights, compare deals, and book with confidence. Cars, transfers, and eSIM tools too.",
    type: "website",
    url: "https://flightdealio.com/about",
  },
  alternates: {
    canonical: "https://flightdealio.com/about",
  },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10 pb-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          About
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          What is FlightDealio?
        </h1>
        <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
          FlightDealio is a travel search site that helps you find flights, compare options, and
          continue to trusted booking partners — plus practical trip tools like rental cars,
          airport transfers, and travel eSIMs.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="mission-heading">
        <h2
          id="mission-heading"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Our mission
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Travel planning should be clear and fast. We built FlightDealio so you can search routes
          and dates in one place, see live partner results, and book the deal that fits your trip —
          without jumping between a dozen unrelated sites first.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="flights-heading">
        <h2
          id="flights-heading"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Flight search
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Enter your airports or cities, travel dates, cabin class, and how many travelers you are.
          FlightDealio runs a live search and shows results powered by our travel partners so you
          can compare prices and flight details, then complete booking with the seller you choose.
        </p>
        <p>
          <Link
            href="/"
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Search flights →
          </Link>
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="tools-heading">
        <h2
          id="tools-heading"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          More travel tools
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          <li>
            <Link href="/cars" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Rental cars
            </Link>{" "}
            — compare cars for your destination and dates.
          </li>
          <li>
            <Link href="/taxi" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Airport transfers
            </Link>{" "}
            — book a taxi or transfer from pick-up to drop-off.
          </li>
          <li>
            <Link href="/esim" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Travel eSIM
            </Link>{" "}
            — get mobile data abroad without swapping a physical SIM.
          </li>
          <li>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Stays</span> — hotel
            and stay search is coming soon.
          </li>
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="how-heading">
        <h2
          id="how-heading"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          How booking works
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          FlightDealio is a search and comparison front door. When you select an offer, you continue
          to a partner travel agency or brand to finish payment and receive your tickets or
          confirmation. Prices and availability come from those partners and can change; always
          confirm the final fare on the booking site before you pay.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="who-heading">
        <h2
          id="who-heading"
          className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Who it is for
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          Whether you are planning a weekend getaway, a family trip, or a long-haul flight,
          FlightDealio is for travelers who want a simple starting point: search once, compare
          options, and book with confidence.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ready to go?</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Start with a flight search, or explore cars, transfers, and eSIM for the rest of your
          trip.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Search flights
          </Link>
          <Link
            href="/esim"
            className="inline-flex rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Get eSIM
          </Link>
        </div>
      </section>
    </article>
  );
}
