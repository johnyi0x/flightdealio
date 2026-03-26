import { createHash } from "crypto";

/**
 * Builds the colon-suffix string Travelpayouts uses inside the flight-search MD5.
 * Mirrors https://github.com/mahnunchik/travelpayouts/blob/master/lib/signature.js
 */
function makeSignatureString(params: unknown): string {
  if (Array.isArray(params)) {
    let signature = "";
    for (const val of params) {
      signature += makeSignatureString(val);
    }
    return signature;
  }
  if (params !== null && typeof params === "object") {
    let signature = "";
    const keys = Object.keys(params as Record<string, unknown>).sort();
    for (const key of keys) {
      signature += makeSignatureString((params as Record<string, unknown>)[key]);
    }
    return signature;
  }
  return `:${params}`;
}

/**
 * MD5(API token + recursive sorted payload) for `POST /v1/flight_search`.
 */
export function travelpayoutsFlightSearchSignature(
  token: string,
  params: Record<string, unknown>,
): string {
  const suffix = makeSignatureString(params);
  return createHash("md5").update(token + suffix).digest("hex");
}
