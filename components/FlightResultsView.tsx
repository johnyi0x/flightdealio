"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlightOfferPublic } from "@/lib/flightTypes";

function BookPartner({ offer }: { offer: FlightOfferPublic }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = offer.referralUrl?.trim();
  const tp = offer.travelpayoutsClick;

  if (ref) {
    return (
      <a
        href={ref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-[220px] items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
      >
        Book on {offer.agencyName}
      </a>
    );
  }

  if (!tp) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
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
        }}
        className="inline-flex max-w-[220px] items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? "Opening…" : `Book on ${offer.agencyName}`}
      </button>
      {err && <p className="max-w-[220px] text-right text-xs text-rose-600 dark:text-rose-400">{err}</p>}
    </div>
  );
}

type Stored = {
  offers: FlightOfferPublic[];
  source?: "travelpayouts" | "travelpayouts_data" | "duffel_kiwi";
  emptyHint?: string;
  dealDisclaimer?: string;
  duffelDisclaimer?: string;
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

  if (!data.offers?.length) {
    return (
      <div className="space-y-4">
        {data.meta && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.meta.origin} → {data.meta.destination} · Out {data.meta.departureDate}
            {data.meta.returnDate ? ` · Back ${data.meta.returnDate}` : " · One way"}
          </p>
        )}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {data.emptyHint || "No fares returned for this search."}
        </div>
        <Link href="/" className="text-sm font-semibold text-sky-700 underline dark:text-sky-400">
          New search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.meta && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {data.meta.origin} → {data.meta.destination} · Out {data.meta.departureDate}
          {data.meta.returnDate ? ` · Back ${data.meta.returnDate}` : " · One way"}
        </p>
      )}
      {data.dealDisclaimer && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {data.dealDisclaimer}
        </p>
      )}
      {data.duffelDisclaimer && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
          {data.duffelDisclaimer}
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {data.source === "duffel_kiwi"
          ? "Rows show live Duffel quotes for your dates. Book opens Kiwi.com with your Travelpayouts marker (affilid) for the same route and dates."
          : data.source === "travelpayouts_data"
            ? "Prices come from Aviasales/Jetradar cached data (~48h). Each Book link includes your marker and opens that cached deal on Aviasales when available."
            : "Each price is from a specific booking partner. Book opens that partner’s page (affiliate attribution)."}
      </p>
      <div className="space-y-4">
        {data.offers.map((offer) => (
          <article
            key={offer.id}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ${offer.totalUsd.toFixed(0)}{" "}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">USD</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{offer.agencyName}</p>
              </div>
              <BookPartner offer={offer} />
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
                      <li
                        key={`${seg.departsAt}-${gi}`}
                        className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60"
                      >
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {seg.airlineName}
                          {seg.airlineIata ? ` (${seg.airlineIata})` : ""}
                          {seg.flightNumber ? ` · Flight ${seg.flightNumber}` : ""}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {seg.originCode} {seg.originName} → {seg.destCode} {seg.destName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatIso(seg.departsAt)} → {formatIso(seg.arrivesAt)}
                        </p>
                        {(seg.aircraftName || seg.aircraftIata) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Aircraft: {seg.aircraftName || "—"}
                            {seg.aircraftIata ? ` (${seg.aircraftIata})` : ""}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatIso(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
