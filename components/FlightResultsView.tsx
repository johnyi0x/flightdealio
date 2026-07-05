"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FlightOfferPublic, FlightSeller, FlightSegmentPublic } from "@/lib/flightTypes";

type SortMode = "cheapest" | "best";

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

  const btnClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-brand-600 px-4 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white disabled:opacity-60 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white";

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-slate-800">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {seller.name}
          {cheapest && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Cheapest
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            ${seller.totalUsd.toFixed(0)}
          </span>
          {ref ? (
            <a href={ref} target="_blank" rel="noopener noreferrer sponsored" className={btnClass}>
              Select
            </a>
          ) : tp ? (
            <button type="button" disabled={loading} onClick={openTpClick} className={btnClass}>
              {loading ? "…" : "Select"}
            </button>
          ) : null}
        </div>
        {err && <p className="text-[11px] text-rose-600 dark:text-rose-400">{err}</p>}
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(11, 16) || "—";
  }
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function segmentStops(segments: FlightSegmentPublic[]): number {
  return Math.max(0, segments.length - 1);
}

function FlightTimeline({ segments }: { segments: FlightSegmentPublic[] }) {
  if (!segments.length) return null;
  const first = segments[0]!;
  const last = segments[segments.length - 1]!;
  const stops = segmentStops(segments);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
          {formatTime(first.departsAt)}
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{first.originCode}</p>
        {formatDate(first.departsAt) && (
          <p className="text-[10px] text-slate-400">{formatDate(first.departsAt)}</p>
        )}
      </div>

      <div className="flex min-w-[80px] flex-1 flex-col items-center gap-1">
        <p className="text-[11px] text-slate-400">
          {stops === 0 ? "Direct" : stops === 1 ? "1 stop" : `${stops} stops`}
        </p>
        <div className="relative flex w-full items-center">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          {stops > 0 && (
            <div className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900" />
          )}
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <div className="shrink-0">
        <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
          {formatTime(last.arrivesAt)}
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{last.destCode}</p>
        {formatDate(last.arrivesAt) && (
          <p className="text-[10px] text-slate-400">{formatDate(last.arrivesAt)}</p>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, rank }: { offer: FlightOfferPublic; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const sellers = [...offer.sellers].sort((a, b) => a.totalUsd - b.totalUsd);
  const sellerCount = sellers.length;
  const outbound = offer.slices[0];
  const mainSeg = outbound?.segments[0];
  const airline = mainSeg?.airlineName || "Airline";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Airline + timeline */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {rank === 1 && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Cheapest
              </span>
            )}
            {offer.dateTier === "flex" && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Nearby dates
              </span>
            )}
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{airline}</p>
            {mainSeg?.flightNumber && (
              <p className="text-xs text-slate-400">Flight {mainSeg.flightNumber}</p>
            )}
          </div>
          {outbound && <FlightTimeline segments={outbound.segments} />}
          {offer.slices.length > 1 && (
            <p className="text-xs text-slate-400">
              + return leg ({offer.slices[1]?.segments[0]?.airlineName || "return"})
            </p>
          )}
        </div>

        {/* Price + primary CTA */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 dark:border-slate-800">
          <div className="sm:text-right">
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              ${offer.cheapestUsd.toFixed(0)}
            </p>
            <p className="text-xs text-slate-400">
              {sellerCount > 1 ? `${sellerCount} sellers` : "1 seller"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 sm:min-w-[100px]"
          >
            {expanded ? "Hide" : "Select"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50">
          <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Compare sellers — book on partner site
          </p>
          {sellers.map((s, i) => (
            <SellerRow key={`${s.name}-${i}`} seller={s} cheapest={i === 0 && sellerCount > 1} />
          ))}
          {offer.slices.map((slice, si) =>
            slice.segments.length > 1 || offer.slices.length > 1 ? (
              <div key={si} className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Leg {si + 1} details
                </p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {slice.segments.map((seg, gi) => (
                    <li key={gi}>
                      {seg.airlineName} · {seg.originCode} → {seg.destCode} ·{" "}
                      {formatTime(seg.departsAt)} – {formatTime(seg.arrivesAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      )}
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
    cabinClass?: string;
    directOnly?: boolean;
  };
};

export function FlightResultsView() {
  const [data, setData] = useState<Stored | null | undefined>(undefined);
  const [sort, setSort] = useState<SortMode>("cheapest");

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

  const sortedOffers = useMemo(() => {
    if (!data?.offers?.length) return [];
    const list = [...data.offers];
    if (sort === "cheapest") {
      list.sort((a, b) => a.cheapestUsd - b.cheapestUsd);
    }
    return list;
  }, [data, sort]);

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          Loading results…
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-sm text-amber-950 dark:text-amber-100">No results yet. Start a search.</p>
        <Link href="/" className="text-sm font-bold text-brand-600 hover:underline">
          Search flights
        </Link>
      </div>
    );
  }

  const offers = sortedOffers;
  const allFlex = offers.length > 0 && offers.every((o) => o.dateTier === "flex");
  const cheapest = offers[0]?.cheapestUsd;

  if (!offers.length) {
    return (
      <div className="space-y-4">
        {data.meta && <SearchSummary meta={data.meta} count={0} />}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm dark:border-amber-900/40 dark:bg-amber-950/30">
          {data.emptyHint || "No fares returned for this search."}
        </div>
        {data.affiliateFallback?.url && (
          <a
            href={data.affiliateFallback.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            Search on Kiwi.com
          </a>
        )}
        <Link href="/" className="block text-sm font-bold text-brand-600 hover:underline">
          New search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.meta && <SearchSummary meta={data.meta} count={offers.length} />}

      {/* Sort tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            { id: "cheapest" as const, label: "Cheapest", sub: cheapest ? `from $${cheapest.toFixed(0)}` : "" },
            { id: "best" as const, label: "Best", sub: "Balanced" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSort(tab.id)}
            className={[
              "flex min-w-[100px] flex-1 flex-col items-center rounded-lg px-3 py-2 text-center transition sm:min-w-[120px]",
              sort === tab.id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <span className="text-xs font-bold sm:text-sm">{tab.label}</span>
            <span
              className={[
                "text-[10px]",
                sort === tab.id ? "text-brand-100" : "text-slate-400",
              ].join(" ")}
            >
              {tab.sub}
            </span>
          </button>
        ))}
      </div>

      {allFlex && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          No exact-date fares found — showing closest deals within ±7 days.
        </p>
      )}

      <p className="text-xs text-slate-400">
        Prices at search time · may change at checkout · you book on the seller&apos;s site
      </p>

      <div className="space-y-3">
        {offers.map((offer, i) => (
          <OfferCard key={offer.id} offer={offer} rank={sort === "cheapest" ? i + 1 : 0} />
        ))}
      </div>
    </div>
  );
}

function SearchSummary({
  meta,
  count,
}: {
  meta: NonNullable<Stored["meta"]>;
  count: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {meta.origin}{" "}
            <span className="font-normal text-slate-400">→</span> {meta.destination}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {meta.departureDate}
            {meta.returnDate ? ` – ${meta.returnDate}` : " · One-way"}
            {meta.cabinClass ? ` · ${meta.cabinClass.replace("_", " ")}` : ""}
            {meta.directOnly ? " · Direct only" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <p className="text-xs font-semibold text-slate-500">
              {count} result{count !== 1 ? "s" : ""}
            </p>
          )}
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-950"
          >
            Edit search
          </Link>
        </div>
      </div>
    </div>
  );
}
