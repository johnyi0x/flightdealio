"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const LINKS: { href: string; label: string; soon?: boolean }[] = [
  { href: "/", label: "Flights" },
  { href: "/stays", label: "Stays" },
  { href: "/taxi", label: "Taxi" },
  { href: "/cars", label: "Cars" },
  { href: "/esim", label: "eSIM" },
  { href: "/about", label: "About" },
];

function SoonBadge() {
  return (
    <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      Soon
    </span>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">
            FD
          </span>
          FlightDealio
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {l.label}
              {l.soon && <SoonBadge />}
            </Link>
          ))}
          <ThemeSwitcher />
        </nav>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeSwitcher />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3.5 w-4" aria-hidden>
              <span
                className={[
                  "absolute left-0 top-0 block h-0.5 w-4 rounded bg-current transition-transform duration-300 ease-out",
                  open ? "translate-y-[6px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[6px] block h-0.5 w-4 rounded bg-current transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[12px] block h-0.5 w-4 rounded bg-current transition-transform duration-300 ease-out",
                  open ? "-translate-y-[6px] -rotate-45" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile draw-down panel */}
      <div
        id={panelId}
        className={[
          "overflow-hidden border-t border-slate-200/80 transition-[max-height,opacity] duration-300 ease-out md:hidden dark:border-slate-800/80",
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
        aria-hidden={!open}
      >
        <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <span>{l.label}</span>
              {l.soon && <SoonBadge />}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
