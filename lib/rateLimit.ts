/**
 * Simple sliding-window limiter (per serverless instance). Mitigates casual API abuse;
 * for strict global limits use Vercel Firewall, Upstash Redis, or similar.
 */
type Bucket = { count: number; windowStart: number };

const store = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_KEYS = 8000;

function prune(now: number) {
  if (store.size <= MAX_KEYS) return;
  for (const [k, v] of Array.from(store.entries())) {
    if (now - v.windowStart >= WINDOW_MS * 2) store.delete(k);
  }
}

export function allowRateLimit(routeKey: string, clientIp: string, maxPerMinute: number): boolean {
  if (process.env.RATE_LIMIT_DISABLED === "1") return true;
  const max = Number.isFinite(maxPerMinute) && maxPerMinute > 0 ? maxPerMinute : 60;
  const key = `${routeKey}:${clientIp || "unknown"}`;
  const now = Date.now();
  prune(now);
  let b = store.get(key);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    b = { count: 0, windowStart: now };
    store.set(key, b);
  }
  b.count += 1;
  return b.count <= max;
}

export function rateLimitMax(envName: string, fallback: number): number {
  const n = Number(process.env[envName]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
