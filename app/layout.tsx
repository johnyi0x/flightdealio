import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export const metadata: Metadata = {
  title: "Flight Finder",
  description: "Search flights and explore trips by budget.",
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
          // Set initial theme class before React hydrates to avoid flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme_choice');var choice=stored||'dark';var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=(choice==='dark')?true:(choice==='light')?false:!!prefersDark;document.documentElement.classList.toggle('dark',isDark);}catch(e){/* ignore */}})();`,
          }}
        />
        <Script id="travelpayouts-site-verify" strategy="afterInteractive">
          {`(function () {
    var script = document.createElement("script");
    script.async = 1;
    script.src = "https://emrldtp.cc/NTEyMDA2.js?t=512006";
    document.head.appendChild(script);
  })();`}
        </Script>
        <header className="relative z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Flight Finder
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
              <Link
                href="/"
                className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Flights
              </Link>
              <Link
                href="/budget"
                className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Budget explorer
              </Link>
              <ThemeSwitcher />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
