import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Budget explorer was Duffel-based; removed in favor of Travelpayouts-only flight search.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIpFromRequest(req);
  const cap = rateLimitMax("RATE_LIMIT_BUDGET_SEARCH_PER_MIN", 20);
  if (!allowRateLimit("budget-search", ip, cap)) {
    return NextResponse.json(
      { ok: false, error: "Too many searches. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = parseSearchParams(searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Budget explorer is paused while we keep a single Travelpayouts flight pipeline. Use Flights to search routes with partner-accurate prices and book links.",
    },
    { status: 422 },
  );
}

function parseSearchParams(searchParams: URLSearchParams):
  | { ok: true; value: { origin: string; budgetUsd: number; nights: number; yearMonth: string } }
  | { ok: false; error: string } {
  const origin = (searchParams.get("origin") || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin)) {
    return { ok: false, error: "Origin must be a 3-letter IATA airport code (example: ZRH)." };
  }

  const budgetUsd = Number(searchParams.get("budget"));
  if (!Number.isFinite(budgetUsd) || budgetUsd < 200 || budgetUsd > 50000) {
    return {
      ok: false,
      error: "Max flight spend must be between 200 and 50,000 USD.",
    };
  }

  const nights = Number(searchParams.get("nights"));
  if (!Number.isInteger(nights) || nights < 1 || nights > 21) {
    return { ok: false, error: "Nights must be a whole number between 1 and 21." };
  }

  const yearMonth = (searchParams.get("month") || "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return { ok: false, error: "Month must look like YYYY-MM (example: 2025-07)." };
  }

  return { ok: true, value: { origin, budgetUsd, nights, yearMonth } };
}
