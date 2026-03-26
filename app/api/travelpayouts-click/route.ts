import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLICK_BASE = "https://api.travelpayouts.com/v1/flight_searches";

type Body = { searchId?: string; termsUrl?: number };

/**
 * Resolves a short-lived booking URL for one Travelpayouts search result (user-initiated only).
 */
export async function POST(req: NextRequest) {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Booking link unavailable." }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const searchId = typeof body.searchId === "string" ? body.searchId.trim() : "";
  const termsUrl = body.termsUrl;
  if (!/^[a-z0-9-]{1,80}$/i.test(searchId)) {
    return NextResponse.json({ ok: false, error: "Invalid search id." }, { status: 400 });
  }
  if (typeof termsUrl !== "number" || !Number.isFinite(termsUrl) || termsUrl <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid terms URL key." }, { status: 400 });
  }

  const url = `${CLICK_BASE}/${encodeURIComponent(searchId)}/clicks/${encodeURIComponent(String(termsUrl))}.json`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-access-token": token,
      },
    });
    const json = (await res.json()) as { url?: string };
    if (!res.ok || typeof json.url !== "string" || !json.url.startsWith("http")) {
      console.warn("[api/travelpayouts-click] upstream", res.status, json);
      return NextResponse.json(
        { ok: false, error: "Could not resolve booking link. Try searching again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, url: json.url });
  } catch (e) {
    console.error("[api/travelpayouts-click]", e);
    return NextResponse.json({ ok: false, error: "Upstream request failed." }, { status: 502 });
  }
}
