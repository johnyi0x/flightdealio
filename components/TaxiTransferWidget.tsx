"use client";

import { useEffect, useRef } from "react";

const TAXI_WIDGET_SRC =
  "https://tpwdgt.com/content?trs=544639&powered_by=true&shmarker=713746&language=en&display_currency=USD&transfer_type=any&theme=pososhok&hide_form_extras=true&hide_external_links=false&disable_currency_selector=true&campaign_id=1&promo_id=691";

/**
 * Travelpayouts transfer/taxi widget. Inject the <script> into this
 * container — Next.js <Script> moves it to body end, so the widget lands
 * below the footer.
 */
export function TaxiTransferWidget() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();

    const script = document.createElement("script");
    script.async = true;
    script.charset = "utf-8";
    script.src = TAXI_WIDGET_SRC;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="min-h-[12rem] w-full overflow-x-auto" />;
}
