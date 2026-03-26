"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlaceRow = {
  type?: string;
  iata_code?: string;
  iata_city_code?: string;
  label: string;
};

/**
 * Type-ahead airport/city picker backed by `/api/places`.
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
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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
        setSuggestError("Suggestions unavailable right now.");
        return;
      }
      setRows(json.places ?? []);
    } catch {
      setRows([]);
      setSuggestError("Suggestions unavailable right now.");
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

  const showList = open && rows.length > 0;

  return (
    <div ref={wrapRef} className="relative z-[100] space-y-1 text-sm">
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
            ? "Choose a suggestion to set the airport code."
            : "Optional — pick from suggestions."}
        {loading ? " · Searching…" : ""}
      </p>
      {open && suggestError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{suggestError}</p>
      )}
      {showList && (
        <ul className="absolute z-[200] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {rows.map((r, idx) => (
            <li key={`${idx}-${r.label}`}>
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
