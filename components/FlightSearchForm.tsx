"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { AirportField } from "@/components/AirportField";
import { buildWhiteLabelSearchUrl } from "@/lib/whiteLabel";

function openNativeDatePicker(e: MouseEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  try {
    el.showPicker?.();
  } catch {
    // Unsupported / already open
  }
}

const dateInputClass =
  "w-full min-h-[2.25rem] cursor-pointer border-0 bg-transparent p-0 text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100";

const cellLabelClass =
  "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

const CABIN_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "business", label: "Business" },
] as const;

function travelersSummary(adults: number, children: number, infants: number): string {
  const parts: string[] = [];
  parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
  if (children > 0) parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  if (infants > 0) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function StepperRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base font-bold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-base font-bold text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function FlightSearchForm() {
  const [trip, setTrip] = useState<"round" | "one">("round");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<"economy" | "business">("economy");
  const [travelersOpen, setTravelersOpen] = useState(false);
  const [cabinOpen, setCabinOpen] = useState(false);
  const [travelersStyle, setTravelersStyle] = useState<CSSProperties | null>(null);
  const [cabinStyle, setCabinStyle] = useState<CSSProperties | null>(null);

  const travelersWrapRef = useRef<HTMLDivElement>(null);
  const travelersBtnRef = useRef<HTMLButtonElement>(null);
  const travelersPanelRef = useRef<HTMLDivElement>(null);
  const cabinWrapRef = useRef<HTMLDivElement>(null);
  const cabinBtnRef = useRef<HTMLButtonElement>(null);
  const cabinPanelRef = useRef<HTMLDivElement>(null);
  const travelersPanelId = useId();
  const cabinPanelId = useId();

  const placePanel = useCallback(
    (
      btn: HTMLButtonElement | null,
      setStyle: (s: CSSProperties | null) => void,
      width: number,
    ) => {
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 6;
      const maxH = Math.min(360, window.innerHeight - rect.bottom - 16);
      let left = rect.left;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, rect.right - width);
      }
      setStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        width: Math.min(width, window.innerWidth - 24),
        zIndex: 10000,
        maxHeight: maxH > 120 ? maxH : undefined,
      });
    },
    [],
  );

  const updateTravelersPos = useCallback(() => {
    placePanel(travelersBtnRef.current, setTravelersStyle, 288);
  }, [placePanel]);

  const updateCabinPos = useCallback(() => {
    placePanel(cabinBtnRef.current, setCabinStyle, 180);
  }, [placePanel]);

  useLayoutEffect(() => {
    if (!travelersOpen) {
      setTravelersStyle(null);
      return;
    }
    updateTravelersPos();
    window.addEventListener("scroll", updateTravelersPos, true);
    window.addEventListener("resize", updateTravelersPos);
    return () => {
      window.removeEventListener("scroll", updateTravelersPos, true);
      window.removeEventListener("resize", updateTravelersPos);
    };
  }, [travelersOpen, updateTravelersPos]);

  useLayoutEffect(() => {
    if (!cabinOpen) {
      setCabinStyle(null);
      return;
    }
    updateCabinPos();
    window.addEventListener("scroll", updateCabinPos, true);
    window.addEventListener("resize", updateCabinPos);
    return () => {
      window.removeEventListener("scroll", updateCabinPos, true);
      window.removeEventListener("resize", updateCabinPos);
    };
  }, [cabinOpen, updateCabinPos]);

  useEffect(() => {
    if (!travelersOpen && !cabinOpen) return;
    function onDoc(e: Event) {
      const t = e.target as Node;
      if (travelersOpen) {
        const inTrigger = travelersWrapRef.current?.contains(t);
        const inPanel = travelersPanelRef.current?.contains(t);
        if (!inTrigger && !inPanel) setTravelersOpen(false);
      }
      if (cabinOpen) {
        const inTrigger = cabinWrapRef.current?.contains(t);
        const inPanel = cabinPanelRef.current?.contains(t);
        if (!inTrigger && !inPanel) setCabinOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [travelersOpen, cabinOpen]);

  useEffect(() => {
    if (infants > adults) setInfants(adults);
  }, [adults, infants]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const origin = String(fd.get("origin") || "").trim().toUpperCase();
    const destination = String(fd.get("destination") || "").trim().toUpperCase();
    const departureDate = String(fd.get("departureDate") || "").trim();
    const returnDate =
      trip === "round" ? String(fd.get("returnDate") || "").trim() : "";

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      setError("Pick both airports from the suggestions list.");
      return;
    }
    if (trip === "round" && !returnDate) {
      setError("Choose a return date, or switch to One-way.");
      return;
    }

    const wlUrl = buildWhiteLabelSearchUrl({
      origin,
      destination,
      departureDate,
      returnDate: trip === "round" ? returnDate : null,
      cabinClass,
      adults,
      children,
      infants,
    });

    if (!wlUrl) {
      setError("Check your dates and try again.");
      return;
    }

    let flightSearch = "";
    try {
      flightSearch = new URL(wlUrl).searchParams.get("flightSearch") || "";
    } catch {
      setError("Could not build search link.");
      return;
    }
    if (!flightSearch) {
      setError("Could not build search link.");
      return;
    }

    setBusy(true);
    window.location.assign(
      `/live-search?flightSearch=${encodeURIComponent(flightSearch)}`,
    );
  }

  const maxChildren = Math.max(0, 9 - adults - infants);
  const maxInfants = Math.min(adults, Math.max(0, 9 - adults - children));
  const cabinLabel =
    CABIN_OPTIONS.find((c) => c.value === cabinClass)?.label ?? "Economy";

  const travelersPanel =
    travelersOpen && travelersStyle ? (
      <div
        ref={travelersPanelRef}
        id={travelersPanelId}
        style={travelersStyle}
        className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-label="Travelers"
      >
        <StepperRow
          label="Adults"
          hint="12+ years"
          value={adults}
          min={1}
          max={Math.max(1, 9 - children - infants)}
          onChange={setAdults}
        />
        <StepperRow
          label="Children"
          hint="2–11 years"
          value={children}
          min={0}
          max={maxChildren}
          onChange={setChildren}
        />
        <StepperRow
          label="Infants"
          hint="Under 2 years"
          value={infants}
          min={0}
          max={maxInfants}
          onChange={setInfants}
        />
        <button
          type="button"
          onClick={() => setTravelersOpen(false)}
          className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
        >
          Done
        </button>
      </div>
    ) : null;

  const cabinPanel =
    cabinOpen && cabinStyle ? (
      <div
        ref={cabinPanelRef}
        id={cabinPanelId}
        style={cabinStyle}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        role="listbox"
        aria-label="Cabin"
      >
        {CABIN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={cabinClass === opt.value}
            onClick={() => {
              setCabinClass(opt.value);
              setCabinOpen(false);
            }}
            className={[
              "flex w-full px-4 py-2.5 text-left text-sm font-medium",
              cabinClass === opt.value
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                : "text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
          {(["round", "one"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrip(t)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm",
                trip === t
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              ].join(" ")}
            >
              {t === "round" ? "Round-trip" : "One-way"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-search dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col">
          <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 lg:flex-row">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 lg:flex-1 lg:border-b-0 lg:border-r lg:px-6 lg:py-5">
              <AirportField
                name="origin"
                label="From"
                required
                variant="compact"
                placeholder="City or airport"
              />
            </div>
            <div className="px-5 py-4 lg:flex-1 lg:px-6 lg:py-5">
              <AirportField
                name="destination"
                label="To"
                required
                variant="compact"
                placeholder="City or airport"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex flex-1 border-b border-slate-100 dark:border-slate-800 lg:border-b-0 lg:border-r">
              <label className="flex min-w-0 flex-1 flex-col border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:border-b-0 sm:border-r sm:px-5 sm:py-5 lg:min-w-[9rem]">
                <span className={cellLabelClass}>Depart</span>
                <input
                  name="departureDate"
                  type="date"
                  required
                  onClick={openNativeDatePicker}
                  className={dateInputClass}
                />
              </label>
              {trip === "round" && (
                <label className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5 lg:min-w-[9rem]">
                  <span className={cellLabelClass}>Return</span>
                  <input
                    name="returnDate"
                    type="date"
                    required
                    onClick={openNativeDatePicker}
                    className={dateInputClass}
                  />
                </label>
              )}
            </div>

            <div
              ref={travelersWrapRef}
              className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5 lg:w-44 lg:shrink-0 lg:border-b-0 lg:border-r"
            >
              <span className={cellLabelClass}>Travelers</span>
              <button
                ref={travelersBtnRef}
                type="button"
                aria-expanded={travelersOpen}
                aria-controls={travelersPanelId}
                onClick={() => {
                  setCabinOpen(false);
                  setTravelersOpen((v) => !v);
                }}
                className="flex w-full min-h-[2.25rem] items-center justify-between gap-2 bg-transparent p-0 text-left text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100"
              >
                <span className="truncate">
                  {travelersSummary(adults, children, infants)}
                </span>
                <span className="shrink-0 text-slate-400" aria-hidden>
                  ▾
                </span>
              </button>
            </div>

            <div
              ref={cabinWrapRef}
              className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5 lg:w-36 lg:shrink-0 lg:border-b-0 lg:border-r"
            >
              <span className={cellLabelClass}>Cabin</span>
              <button
                ref={cabinBtnRef}
                type="button"
                aria-expanded={cabinOpen}
                aria-controls={cabinPanelId}
                onClick={() => {
                  setTravelersOpen(false);
                  setCabinOpen((v) => !v);
                }}
                className="flex w-full min-h-[2.25rem] items-center justify-between gap-2 bg-transparent p-0 text-left text-base font-medium text-slate-900 outline-none sm:text-sm dark:text-slate-100"
              >
                <span className="truncate">{cabinLabel}</span>
                <span className="shrink-0 text-slate-400" aria-hidden>
                  ▾
                </span>
              </button>
              <input type="hidden" name="cabinClass" value={cabinClass} />
            </div>

            <div className="flex w-full shrink-0 p-3 lg:w-auto lg:items-stretch lg:self-stretch lg:p-3 lg:pl-2">
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 active:bg-brand-800 disabled:opacity-60 lg:min-w-[8rem] lg:self-center lg:px-6 lg:py-5"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Searching…
                  </span>
                ) : (
                  "Search flights"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </p>
      )}

      {typeof document !== "undefined" && travelersPanel
        ? createPortal(travelersPanel, document.body)
        : null}
      {typeof document !== "undefined" && cabinPanel
        ? createPortal(cabinPanel, document.body)
        : null}
    </form>
  );
}
