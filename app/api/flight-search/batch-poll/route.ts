import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { pollTravelpayoutsResultsBatch } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Runs several Travelpayouts result fetches in one invocation (fewer Vercel function bills per search).
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const cap = rateLimitMax("RATE_LIMIT_FLIGHT_BATCH_POLL_PER_MIN", 80);
    if (!allowRateLimit("flight-search-batch-poll", ip, cap)) {
      return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
    }

    const uuid = (new URL(req.url).searchParams.get("uuid") || "").trim();
    if (!/^[a-z0-9-]{1,80}$/i.test(uuid)) {
      return NextResponse.json({ ok: false, error: "Invalid search id." }, { status: 400 });
    }

    const rounds = Math.min(
      8,
      Math.max(1, Number(process.env.FLIGHT_POLL_ROUNDS_PER_REQUEST) || 4),
    );
    const gapMs = Math.min(1200, Math.max(200, Number(process.env.FLIGHT_POLL_GAP_MS) || 550));

    const merged: unknown[] = [];
    let terminal = false;

    for (let r = 0; r < rounds; r++) {
      const batch = await pollTravelpayoutsResultsBatch(uuid);
      if (!batch.ok) {
        return NextResponse.json({ ok: false, error: batch.error }, { status: 502 });
      }
      for (const row of batch.items) {
        merged.push(row);
      }
      terminal = batch.terminal;
      if (terminal) break;
      if (r < rounds - 1) await delay(gapMs);
    }

    return NextResponse.json({
      ok: true,
      items: merged,
      terminal,
    });
  } catch (e) {
    console.error("[api/flight-search/batch-poll]", e);
    return NextResponse.json({ ok: false, error: "Batch poll failed." }, { status: 500 });
  }
}
