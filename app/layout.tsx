import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

/** Google Ads tag (gtag.js). Override via Vercel env NEXT_PUBLIC_GOOGLE_ADS_ID if needed. */
const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18381531931";

export const metadata: Metadata = {
  title: "FlightDealio — Compare flight deals",
  description: "Search and compare flight prices from partner sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme_choice');var choice=stored||'dark';var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=(choice==='dark')?true:(choice==='light')?false:!!prefersDark;document.documentElement.classList.toggle('dark',isDark);}catch(e){/* ignore */}})();`,
          }}
        />
        {/* Google Ads — root layout = every page (/, /budget, /flight-results, …) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        <Script id="travelpayouts-site-verify" strategy="afterInteractive">
          {`(function () {
    var script = document.createElement("script");
    script.async = 1;
    script.src = "https://emrldtp.cc/NTEyMDA2.js?t=512006";
    document.head.appendChild(script);
  })();`}
        </Script>
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">
                FD
              </span>
              FlightDealio
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-3 sm:text-sm"
              >
                Flights
              </Link>
              <a
                href="/live-search"
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950 sm:px-3 sm:text-sm"
              >
                Live search
              </a>
              <Link
                href="/budget"
                className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:inline sm:px-3 sm:text-sm"
              >
                Budget
              </Link>
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
