"use client";

import { useEffect, useRef } from "react";

const LOCALRENT_WIDGET_SRC =
  "https://tpwdgt.com/content?trs=544639&shmarker=713746&locale=en&country=23&city=23571&powered_by=true&campaign_id=87&promo_id=2466";

/**
 * Travelpayouts Localrent widget. Must inject the <script> into this
 * container — Next.js <Script> moves it to body end, so the widget
 * (document.currentScript) lands below the footer.
 */
export function RentalCarsWidget() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();

    const script = document.createElement("script");
    script.async = true;
    script.charset = "utf-8";
    script.src = LOCALRENT_WIDGET_SRC;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="min-h-[28rem] w-full overflow-x-auto" />;
}
