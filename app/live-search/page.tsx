"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { WHITELABEL_BASE_URL } from "@/lib/whiteLabel";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18381531931";
const ADS_CONVERSION_SEND_TO =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO?.trim() ||
  "AW-18381531931/cQKgCNCNv98ceJvW_7xE";

/**
 * Bridge: only counts as Ads conversion when ?flightSearch= is present
 * (real search from homepage). Bare /live-search redirects home — no conversion.
 *
 * Ads URL rule: contains flightdealio.com/live-search
 * Prefer also requiring flightSearch in the URL if Ads UI allows.
 */
export default function LiveSearchBridgePage() {
  const [target, setTarget] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const wlHome = useMemo(() => WHITELABEL_BASE_URL, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flightSearch = params.get("flightSearch")?.trim();
    const fdStays = params.get("fdStays");

    // No real search → do not fire Ads conversion
    if (!flightSearch) {
      window.location.replace("/");
      return;
    }

    const staysQ =
      fdStays === "0" ? "&fdStays=0" : fdStays === "1" ? "&fdStays=1" : "";
    const next = `${wlHome}/?flightSearch=${encodeURIComponent(flightSearch)}${staysQ}`;
    setTarget(next);
    setReady(true);

    const t = window.setTimeout(() => {
      window.location.replace(next);
    }, 700);
    return () => window.clearTimeout(t);
  }, [wlHome]);

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

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
          Searching flights…
        </h1>
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        {target && (
          <a
            href={target}
            className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Continue
          </a>
        )}
      </div>
    </>
  );
}
