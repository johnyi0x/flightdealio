"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { WHITELABEL_BASE_URL } from "@/lib/whiteLabel";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18381531931";
/** Google Ads "구독" conversion label (from Ads UI). Override via env if recreated. */
const ADS_CONVERSION_SEND_TO =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO?.trim() ||
  "AW-18381531931/cQKgCNCNv98ceJvW_7xE";

/**
 * Bridge page on the main domain so Google Ads "page load / URL contains"
 * conversions can fire on flightdealio.com (auto-detect is unreliable on the
 * Travelpayouts CNAME White Label host). Then redirect to live search.
 *
 * Set Ads URL rule to contain: flightdealio.com/live-search
 */
export default function LiveSearchBridgePage() {
  const [target, setTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wlHome = useMemo(() => WHITELABEL_BASE_URL, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const flightSearch = params.get("flightSearch")?.trim();
      const next = flightSearch
        ? `${wlHome}/?flightSearch=${encodeURIComponent(flightSearch)}`
        : `${wlHome}/`;
      setTarget(next);

      // Explicit conversion (works even when Ads "auto URL" is flaky)
      const w = window as Window & {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
      };
      w.dataLayer = w.dataLayer || [];
      if (typeof w.gtag === "function") {
        w.gtag("event", "conversion", { send_to: ADS_CONVERSION_SEND_TO });
      }

      const t = window.setTimeout(() => {
        window.location.replace(next);
      }, 600);
      return () => window.clearTimeout(t);
    } catch {
      setError("Could not open live search. Try again from the homepage.");
    }
  }, [wlHome]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="live-search-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
          gtag('event', 'conversion', { send_to: '${ADS_CONVERSION_SEND_TO}' });
        `}
      </Script>

      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">
          FD
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Opening FlightDealio live search…
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Taking you to partner fares on flights.flightdealio.com
        </p>
        {error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        )}
        {target && (
          <a
            href={target}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Continue manually
          </a>
        )}
      </div>
    </>
  );
}
