"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeChoice = "system" | "light" | "dark";

function getPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

/**
 * Theme menu: avoids hydration mismatches by not rendering choice text until
 * the client has read `localStorage` (server + first client paint stay aligned).
 */
export function ThemeSwitcher() {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme_choice") as ThemeChoice | null;
    setChoice(stored ?? "dark");
  }, []);

  useEffect(() => {
    if (choice === null) return;
    localStorage.setItem("theme_choice", choice);

    const applyScheme = (isDark: boolean) => {
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    if (choice === "system") {
      const media = window.matchMedia?.("(prefers-color-scheme: dark)");
      const apply = () => applyScheme(!!media?.matches);
      apply();
      media?.addEventListener?.("change", apply);
      return () => media?.removeEventListener?.("change", apply);
    }

    applyScheme(choice === "dark");
  }, [choice]);

  const icon = useMemo(() => {
    const c = choice ?? "dark";
    if (c === "dark") {
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      );
    }
    if (c === "light") {
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m19.07 4.93-1.41 1.41" />
          <path d="m6.34 17.66-1.41 1.41" />
        </svg>
      );
    }
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        <path d="M3 12h2" />
      </svg>
    );
  }, [choice]);

  const labelText =
    choice === null
      ? ""
      : choice === "system"
        ? "System"
        : choice === "dark"
          ? "Dark"
          : "Light";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Theme toggle menu"
      >
        {icon}
        <span className="hidden sm:inline" suppressHydrationWarning>
          {labelText || "\u00a0"}
        </span>
      </button>

      <div
        className={[
          "absolute right-0 z-30 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-200 ease-out",
          "dark:border-slate-800 dark:bg-slate-900",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        ].join(" ")}
        role="menu"
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => {
            setChoice("system");
            setOpen(false);
          }}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <span>System (browser)</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {getPrefersDark() ? "Dark" : "Light"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setChoice("light");
            setOpen(false);
          }}
          className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <span>Light</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {choice === "light" ? "Selected" : ""}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setChoice("dark");
            setOpen(false);
          }}
          className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <span>Dark</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {choice === "dark" ? "Selected" : ""}
          </span>
        </button>
      </div>
    </div>
  );
}
