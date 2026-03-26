/**
 * Converts Duffel totals into USD using Frankfurter (ECB-based, no API key).
 * We cache per currency for the lifetime of the Node process to avoid spamming
 * their free endpoint during one user search.
 */
const rateToUsd = new Map<string, number>();

/**
 * Converts an amount from `currency` (ISO 4217) into USD using cached FX rates.
 * Returns null when the currency is unknown or the FX API fails.
 */
export async function convertToUsd(amount: number, currency: string): Promise<number | null> {
  const c = currency.toUpperCase();
  if (!Number.isFinite(amount)) return null;
  if (c === "USD") return amount;

  const rate = await fetchUsdRate(c);
  if (rate === null) return null;
  return amount * rate;
}

/**
 * Fetches how many USD one unit of `fromCurrency` is worth, then memoizes it.
 */
async function fetchUsdRate(fromCurrency: string): Promise<number | null> {
  if (rateToUsd.has(fromCurrency)) return rateToUsd.get(fromCurrency)!;

  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
    fromCurrency,
  )}&to=USD`;
  console.log("[FX] GET frankfurter", { url });
  const res = await fetch(url, { next: { revalidate: 0 } });
  const json: unknown = await res.json();
  console.log("[FX] frankfurter response", json);

  const rates = (json as { rates?: { USD?: number } }).rates;
  const usd = rates?.USD;
  if (!res.ok || typeof usd !== "number") return null;

  rateToUsd.set(fromCurrency, usd);
  return usd;
}
