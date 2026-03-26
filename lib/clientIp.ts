import type { NextRequest } from "next/server";

/**
 * Best-effort visitor IP from reverse-proxy headers (Vercel, Cloudflare, etc.).
 */
export function getClientIpFromRequest(req: NextRequest): string {
  const candidates = [
    req.headers.get("x-vercel-forwarded-for"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const first = raw.split(",")[0]!.trim();
    if (first && !first.startsWith("127.") && first !== "::1") return first;
  }
  return "";
}

/** Same as `getClientIpFromRequest` but allows `TRAVELPAYOUTS_USER_IP` override (local testing). */
export function getClientIpForTravelpayouts(req: NextRequest): string {
  const override = process.env.TRAVELPAYOUTS_USER_IP?.trim();
  if (override) return override;
  return getClientIpFromRequest(req);
}
