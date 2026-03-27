import { NextRequest, NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/clientIp";
import { allowRateLimit, rateLimitMax } from "@/lib/rateLimit";
import { compileTravelpayoutsOffers, type TravelpayoutsCabin } from "@/lib/travelpayoutsFlightSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req);
    const cap = rateLimitMax("RATE_LIMIT_FLIGHT_COMPILE_PER_MIN", 40);
    if (!allowRateLimit("flight-search-compile", ip, cap)) {
      return NextResponse.json(
        { ok: false, error: "Too many compile requests. Wait a moment." },
        { status: 429 },
      );
    }

    const body = (await req.json()) as {
      searchId?: string;
      accumulated?: unknown[];
      directOnly?: boolean;
      cabinClass?: string;
    };

    const searchId = typeof body.searchId === "string" ? body.searchId.trim() : "";
    if (!/^[a-z0-9-]{1,80}$/i.test(searchId)) {
      return NextResponse.json({ ok: false, error: "Invalid search id." }, { status: 400 });
    }

    const acc = body.accumulated;
    if (!Array.isArray(acc) || acc.length > 500) {
      return NextResponse.json({ ok: false, error: "Invalid results payload." }, { status: 400 });
    }

    const directOnly = Boolean(body.directOnly);
    const cabinRaw = String(body.cabinClass || "economy").toLowerCase();
    const allowed: TravelpayoutsCabin[] = ["economy", "premium_economy", "business", "first"];
    const cabinClass = (allowed.includes(cabinRaw as TravelpayoutsCabin)
      ? cabinRaw
      : "economy") as TravelpayoutsCabin;

    const capEnv = Number(process.env.FLIGHT_RESULTS_CAP);
    const limit = Number.isFinite(capEnv) && capEnv > 0 ? Math.min(capEnv, 120) : 80;

    const offers = await compileTravelpayoutsOffers({
      searchId,
      accumulated: acc,
      directOnly,
      cabinClass,
      limit,
    });

    if (offers.length === 0) {
      return NextResponse.json({
        ok: true,
        offers: [],
        source: "travelpayouts",
        emptyHint:
          "No partner fares for this search. Try other dates, nearby airports, or allow connections.",
      });
    }

    return NextResponse.json({ ok: true, offers, source: "travelpayouts" });
  } catch (e) {
    console.error("[api/flight-search/compile]", e);
    return NextResponse.json({ ok: false, error: "Could not build results." }, { status: 500 });
  }
}
