"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlightOfferPublic, FlightSeller } from "@/lib/flightTypes";

/** One seller row: shows price + a Book button that opens that seller for THIS itinerary. */
function SellerRow({
  seller,
  cheapest,
}: {
  seller: FlightSeller;
  cheapest: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = seller.referralUrl?.trim();
  const tp = seller.travelpayoutsClick;

  async function openTpClick() {
    if (!tp) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/travelpayouts-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: tp.searchId, termsUrl: tp.termsUrl }),
      });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!json.ok || !json.url) {
        setErr(json.error || "Could not open booking link.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      setErr("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {seller.name}
          {cheapest && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Cheapest
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ${seller.totalUsd.toFixed(0)} {seller.totalCurrency}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        {ref ? (
          <a
            href={ref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            Book ${seller.totalUsd.toFixed(0)}
          </a>
        ) : tp ? (
          <button
            type="button"
            disabled={loading}
            onClick={openTpClick}
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Opening…" : `Book $${seller.totalUsd.toFixed(0)}`}
          </button>
        ) : null}
        {err && <p className="max-w-[180px] text-right text-[11px] text-rose-600 dark:text-rose-400">{err}</p>}
      </div>
    </div>
  );
}

function OfferCard({ offer }: { offer: FlightOfferPublic }) {
  const sellers = [...offer.sellers].sort((a, b) => a.totalUsd - b.totalUsd);
  const sellerCount = sellers.length;

  return (
    <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            From ${offer.cheapestUsd.toFixed(0)}{" "}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">USD</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sellerCount > 1 ? `${sellerCount} sellers for this flight` : "1 seller"}
          </p>
        </div>
        {offer.dateTier === "flex" && (
          <span className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Nearby dates (±7 days)
          </span>
        )}
      </div>

      <div className="space-y-3">
        {offer.slices.map((slice, si) => (
          <div key={si} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            {slice.duration && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Leg {si + 1} · {slice.duration}
              </p>
            )}
            <ul className="space-y-2 text-sm">
              {slice.segments.map((seg, gi) => (
                <li key={`${seg.departsAt}-${gi}`} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {seg.airlineName}
                    {seg.flightNumber ? ` · Flight ${seg.flightNumber}` : ""}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {seg.originCode} {seg.originName} → {seg.destCode} {seg.destName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatIso(seg.departsAt)} → {formatIso(seg.arrivesAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Compare sellers
        </p>
        {sellers.map((s, i) => (
          <SellerRow key={`${s.name}-${i}`} seller={s} cheapest={i === 0 && sellerCount > 1} />
        ))}
      </div>
    </article>
  );
}

type Stored = {
  offers: FlightOfferPublic[];
  source?: "travelpayouts" | "travelpayouts_data" | "kiwi_tequila";
  emptyHint?: string;
  dealDisclaimer?: string;
  kiwiDisclaimer?: string;
  affiliateFallback?: { url: string; title: string; body: string };
  meta?: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate: string | null;
  };
};

export function FlightResultsView() {
  const [data, setData] = useState<Stored | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("flight_search_payload");
      if (!raw) {
        setData(null);
        return;
      }
      setData(JSON.parse(raw) as Stored);
    } catch {
      setData(null);
    }
  }, []);

  if (data === undefined) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading results…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          No results here yet. Start a search from the home page.
        </div>
        <Link href="/" className="text-sm font-semibold text-sky-700 underline dark:text-sky-400">
          Back to flight search
        </Link>
      </div>
    );
  }

  const offers = data.offers ?? [];
  const allFlex = offers.length > 0 && offers.every((o) => o.dateTier === "flex");

  if (!offers.length) {
    return (
      <div className="space-y-4">
        {data.meta && <RouteLine meta={data.meta} />}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {data.emptyHint || "No fares returned for this search."}
        </div>
        {data.affiliateFallback?.url && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900/40 dark:bg-sky-950/30">
            <p className="mb-2 text-sm font-semibold text-sky-950 dark:text-sky-100">
              {data.affiliateFallback.title}
            </p>
            <p className="mb-4 text-xs text-sky-900/90 dark:text-sky-200/90">{data.affiliateFallback.body}</p>
            <a
              href={data.affiliateFallback.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Search on Kiwi.com
            </a>
          </div>
        )}
        <Link href="/" className="text-sm font-semibold text-sky-700 underline dark:text-sky-400">
          New search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.meta && <RouteLine meta={data.meta} />}

      {allFlex && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          No fares were cached for your exact dates, so these are the closest deals within ±7 days. Each card shows
          its real travel dates above.
        </p>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Prices were live at search time and can change before checkout. We compare sellers; you complete the booking
        on the seller&rsquo;s site.
      </p>

      <div className="space-y-4">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}

function RouteLine({ meta }: { meta: NonNullable<Stored["meta"]> }) {
  return (
    <p className="text-sm text-slate-600 dark:text-slate-400">
      {meta.origin} → {meta.destination} · Out {meta.departureDate}
      {meta.returnDate ? ` · Back ${meta.returnDate}` : " · One way"}
    </p>
  );
}

function formatIso(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
