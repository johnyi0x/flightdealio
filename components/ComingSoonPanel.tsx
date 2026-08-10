import Link from "next/link";

export function ComingSoonPanel({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        Coming soon
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{blurb}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
      >
        Search flights
      </Link>
    </div>
  );
}
