export type Cabin = "economy" | "premium_economy" | "business" | "first";

export function parseFlightSearchBody(body: Record<string, unknown>):
  | {
      ok: true;
      value: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate: string | null;
        directOnly: boolean;
        cabinClass: Cabin;
      };
    }
  | { ok: false; error: string } {
  const origin = String(body.origin || "")
    .trim()
    .toUpperCase();
  const destination = String(body.destination || "")
    .trim()
    .toUpperCase();
  const departureDate = String(body.departureDate || "").trim();
  const returnRaw = body.returnDate;
  const returnDate =
    returnRaw === null || returnRaw === undefined || returnRaw === ""
      ? null
      : String(returnRaw).trim();

  if (!/^[A-Z]{3}$/.test(origin)) {
    return { ok: false, error: "Origin must be a 3-letter IATA code." };
  }
  if (!/^[A-Z]{3}$/.test(destination)) {
    return { ok: false, error: "Destination must be a 3-letter IATA code." };
  }
  if (origin === destination) {
    return { ok: false, error: "Origin and destination must differ." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return { ok: false, error: "Departure must be YYYY-MM-DD." };
  }
  if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    return { ok: false, error: "Return date must be YYYY-MM-DD or empty for one-way." };
  }
  if (returnDate && returnDate < departureDate) {
    return { ok: false, error: "Return must be on or after departure." };
  }

  const directOnly = Boolean(body.directOnly);
  const cabinRaw = String(body.cabinClass || "economy").toLowerCase();
  const allowed: Cabin[] = ["economy", "premium_economy", "business", "first"];
  const cabinClass = (allowed.includes(cabinRaw as Cabin) ? cabinRaw : "economy") as Cabin;

  return {
    ok: true,
    value: {
      origin,
      destination,
      departureDate,
      returnDate,
      directOnly,
      cabinClass,
    },
  };
}
