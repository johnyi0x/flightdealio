"use client";

import { useEffect, useRef } from "react";

const ESIM_WIDGET_SRC =
  "https://tpwdgt.com/content?trs=544639&shmarker=713746&locale=en&powered_by=true&color_button=%232563eb&color_focused=%232563eb&secondary=%23FFFFFF&dark=%2311100f&light=%23FFFFFF&special=%23C4C4C4&border_radius=5&plain=false&no_labels=&promo_id=8588&campaign_id=541";

/**
 * Travelpayouts eSIM widget. Inject the <script> into this container —
 * Next.js <Script> moves it to body end, so the widget would land below the footer.
 */
export function EsimWidget() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.replaceChildren();

    const script = document.createElement("script");
    script.async = true;
    script.charset = "utf-8";
    script.src = ESIM_WIDGET_SRC;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, []);

  return <div ref={hostRef} className="min-h-[16rem] w-full overflow-x-auto" />;
}
