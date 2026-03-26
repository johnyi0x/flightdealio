"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlaceRow = {
  type?: string;
  iata_code?: string;
  iata_city_code?: string;
  label: string;
};

/**
 * Type-ahead airport/city picker backed by `/api/places` so travelers can search
 * “Atlanta” instead of guessing `ATL`.
 */
export function AirportField({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [iata, setIata] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(q.trim())}`);
      const json = (await res.json()) as { ok?: boolean; places?: PlaceRow[] };
      setRows(json.places ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(query);
    }, 220);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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

  return (
    <div ref={wrapRef} className="relative space-y-1 text-sm">
      <label className="block">
        <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setIata("");
          }}
          onFocus={() => setOpen(true)}
          placeholder="City or airport name…"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      <input type="hidden" name={name} value={iata} required={required} />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {iata
          ? `Selected: ${iata}`
          : required
            ? "Pick a row below to lock the IATA code."
            : "Optional — pick from suggestions."}
        {loading ? " · Searching…" : ""}
      </p>
      {open && rows.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {rows.map((r, idx) => (
            <li key={`${r.iata_code}-${idx}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => pickPlace(r)}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
