"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

type PlaceRow = {
  type?: string;
  iata_code?: string;
  iata_city_code?: string;
  label: string;
};

type AirportFieldProps = {
  name: string;
  label: string;
  required?: boolean;
  /** Compact mode for unified search bar (no outer label, smaller text). */
  variant?: "default" | "compact";
  placeholder?: string;
};

/**
 * Type-ahead airport picker. Dropdown renders in a portal with fixed positioning
 * so it never sits behind sibling form fields on mobile.
 */
export function AirportField({
  name,
  label,
  required,
  variant = "default",
  placeholder = "City or airport",
}: AirportFieldProps) {
  const [query, setQuery] = useState("");
  const [iata, setIata] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const compact = variant === "compact";

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setRows([]);
      setSuggestError(null);
      return;
    }
    setLoading(true);
    setSuggestError(null);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q.trim())}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; places?: PlaceRow[] };
      if (!res.ok || json.ok === false) {
        setRows([]);
        setSuggestError("Suggestions unavailable.");
        return;
      }
      setRows(json.places ?? []);
    } catch {
      setRows([]);
      setSuggestError("Suggestions unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(query), 220);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const updateDropdownPosition = useCallback(() => {
    const wrap = wrapRef.current;
    const input = inputRef.current;
    if (!wrap || !input) return;
    const wrapRect = wrap.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const minW = compact ? 280 : 220;
    setDropdownStyle({
      position: "fixed",
      top: inputRect.bottom + 6,
      left: wrapRect.left,
      width: Math.max(wrapRect.width, minW),
      zIndex: 9999,
      maxHeight: Math.min(320, window.innerHeight - inputRect.bottom - 20),
    });
  }, [compact]);

  useLayoutEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return;
    }
    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [open, rows.length, updateDropdownPosition]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        const portal = document.getElementById(`airport-dropdown-${name}`);
        if (portal?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [name]);

  function pickPlace(p: PlaceRow) {
    const code =
      p.type === "city"
        ? (p.iata_city_code || p.iata_code || "").toUpperCase()
        : (p.iata_code || "").toUpperCase();
    if (!code) return;
    setIata(code);
    setQuery(p.label);
    setOpen(false);
  }

  const showList = open && rows.length > 0;
  const portalId = `airport-dropdown-${name}`;

  const dropdown = showList && dropdownStyle && (
    <ul
      id={portalId}
      style={dropdownStyle}
      className="scrollbar-thin overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-search dark:border-slate-700 dark:bg-slate-900"
      role="listbox"
    >
      {rows.map((r, idx) => (
        <li key={`${idx}-${r.label}`} role="option">
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-sm leading-snug hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickPlace(r)}
          >
            {r.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1 md:min-w-[10rem] lg:min-w-[12rem]">
      {!compact && (
        <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {label}
        </span>
      )}
      {compact && (
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setIata("");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label={label}
        aria-expanded={open}
        aria-autocomplete="list"
        className={
          compact
            ? "w-full min-h-[2.25rem] border-0 bg-transparent px-0 py-2 text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-sm dark:text-slate-100 dark:placeholder:text-slate-500"
            : "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-brand-500/30 focus:border-brand-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        }
      />
      <input type="hidden" name={name} value={iata} required={required} />
      {!compact && iata && (
        <p className="mt-1 text-xs text-brand-600 dark:text-brand-500">Selected: {iata}</p>
      )}
      {compact && iata && (
        <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">{iata}</p>
      )}
      {open && suggestError && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{suggestError}</p>
      )}
      {open && loading && !rows.length && (
        <p className="mt-1 text-xs text-slate-400">Searching…</p>
      )}
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
