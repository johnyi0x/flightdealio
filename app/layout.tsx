import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18381531931";

export const metadata: Metadata = {
  title: "FlightDealio — Search flights",
  description: "Search flights and compare deals on FlightDealio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme_choice');var choice=stored||'dark';var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=(choice==='dark')?true:(choice==='light')?false:!!prefersDark;document.documentElement.classList.toggle('dark',isDark);}catch(e){/* ignore */}})();`,
          }}
        />
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
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              FlightDealio
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search flights. More travel tools coming soon.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
