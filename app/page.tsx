import { FlightSearchForm } from "@/components/FlightSearchForm";

export default function HomePage() {
  return (
    <div className="-mx-4 sm:mx-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hero via-brand-900 to-hero-dark px-4 pb-10 pt-8 sm:rounded-2xl sm:px-8 sm:pb-12 sm:pt-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Find the right flight at the right price
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Compare fares from partner sellers, then book on the site you choose. Search exact dates or
              explore nearby deals.
            </p>
          </div>

          <FlightSearchForm />
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto mt-8 grid max-w-3xl gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {[
          { title: "Compare sellers", body: "See multiple booking options for the same route." },
          { title: "Exact dates first", body: "We search your dates before showing nearby deals." },
          { title: "Book with partners", body: "Complete checkout on Aviasales, Kiwi, and more." },
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
    </div>
  );
}
