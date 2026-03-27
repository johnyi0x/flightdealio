import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { pollTravelpayoutsResultsBatch } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 25;

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const cap = rateLimitMax("RATE_LIMIT_FLIGHT_POLL_PER_MIN", 200);
    if (!allowRateLimit("flight-search-poll", ip, cap)) {
      return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
    }

    const uuid = (new URL(req.url).searchParams.get("uuid") || "").trim();
    if (!/^[a-z0-9-]{1,80}$/i.test(uuid)) {
      return NextResponse.json({ ok: false, error: "Invalid search id." }, { status: 400 });
    }

    const batch = await pollTravelpayoutsResultsBatch(uuid);
    if (!batch.ok) {
      return NextResponse.json({ ok: false, error: batch.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      items: batch.items,
      terminal: batch.terminal,
    });
  } catch (e) {
    console.error("[api/flight-search/poll]", e);
    return NextResponse.json({ ok: false, error: "Poll failed." }, { status: 500 });
  }
}
