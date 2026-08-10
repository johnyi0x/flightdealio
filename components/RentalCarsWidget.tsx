"use client";

import Script from "next/script";

const LOCALRENT_WIDGET_SRC =
  "https://tpwdgt.com/content?trs=544639&shmarker=713746&locale=en&country=23&city=23571&powered_by=true&campaign_id=87&promo_id=2466";

/** Travelpayouts Localrent White Label widget (injects search + results). */
export function RentalCarsWidget() {
  return (
    <div className="min-h-[28rem] w-full overflow-x-auto">
      <Script src={LOCALRENT_WIDGET_SRC} strategy="afterInteractive" />
    </div>
  );
}
