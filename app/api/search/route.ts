import { NextRequest, NextResponse } from "next/server";
import { runBudgetSearch } from "@/lib/budgetSearch";

export const dynamic = "force-dynamic";

/**
 * Budget explorer search (sampled destinations). Secrets stay server-side.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseSearchParams(searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const token = process.env.DUFFEL_ACCESS_TOKEN;
    const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || "";

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Search is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }

    const result = await runBudgetSearch({
      origin: parsed.value.origin,
      budgetUsd: parsed.value.budgetUsd,
      nights: parsed.value.nights,
      yearMonth: parsed.value.yearMonth,
      duffelAccessToken: token,
      affiliateMarker: marker,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true, results: result.results, warnings: result.warnings });
  } catch (e) {
    console.error("[api/search] failed", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again in a moment." },
      { status: 500 },
    );
  }
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
