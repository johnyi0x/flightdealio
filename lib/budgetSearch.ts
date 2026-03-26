import { addDaysIso, midMonthDateIso } from "@/lib/dates";
import { pickDestinationBatch } from "@/lib/destinationSeeds";
import { fetchCheapestRoundTripUsd } from "@/lib/duffel";
import { buildKiwiBudgetFlightsLink } from "@/lib/affiliate";
import {
  explainBudgetFlightOnly,
  normalizeValueScores,
  rawBudgetFlightEfficiency,
} from "@/lib/scoring";

export type PublicDestinationResult = {
  destinationCityCode: string;
  destinationLabel: string;
  flightUsd: number;
  valueScore: number;
  dealExplanation: string;
  affiliateFlightsUrl: string;
};

export type BudgetSearchSuccess = {
  ok: true;
  results: PublicDestinationResult[];
  warnings: string[];
};

export type BudgetSearchFailure = {
  ok: false;
  error: string;
};

/**
 * Budget explorer: sample many hub airports from your origin, keep only quotes
 * under the traveler’s budget, rank by “value” (room under budget vs. fare).
 */
export async function runBudgetSearch(input: {
  origin: string;
  budgetUsd: number;
  nights: number;
  yearMonth: string;
  duffelAccessToken: string;
  affiliateMarker: string;
}): Promise<BudgetSearchSuccess | BudgetSearchFailure> {
  const warnings: string[] = [
    "We only sample a curated list of major airports each run—this is an explorer, not an exhaustive world search.",
  ];

  const outbound = midMonthDateIso(input.yearMonth);
  const inbound = addDaysIso(outbound, input.nights);

  const destinations = pickDestinationBatch({
    origin: input.origin,
    limit: 12,
    salt: `${input.origin}:${input.yearMonth}`,
  });

  const rows: InternalCandidate[] = [];
  for (const destination of destinations) {
    const quote = await fetchCheapestRoundTripUsd({
      token: input.duffelAccessToken,
      origin: input.origin,
      destination,
      outboundDate: outbound,
      returnDate: inbound,
    });
    if (!quote) continue;

    const affiliateFlightsUrl = buildKiwiBudgetFlightsLink({
      marker: input.affiliateMarker || "YOUR_MARKER",
      originIata: input.origin,
      destinationIata: quote.destinationAirport,
      outboundDate: outbound,
      returnDate: inbound,
    });

    rows.push({
      destinationCityCode: quote.destinationCityCode,
      destinationLabel: quote.destinationLabel,
      flightUsd: quote.flightUsd,
      affiliateFlightsUrl,
    });
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "Duffel returned no round-trip quotes for the sampled destinations on those dates. Try another month, a major hub origin, or fewer nights.",
    };
  }

  const affordable = rows.filter((c) => c.flightUsd <= input.budgetUsd);
  if (affordable.length === 0) {
    return {
      ok: false,
      error:
        "Every sampled flight quote was above your budget. Raise the budget, pick a closer month, or reduce nights.",
    };
  }

  const efficiencies = affordable.map((c) =>
    rawBudgetFlightEfficiency({ flightUsd: c.flightUsd, budgetUsd: input.budgetUsd }),
  );
  const scores = normalizeValueScores(efficiencies);

  const enriched = affordable.map((c, idx) => ({
    ...c,
    valueScore: scores[idx]!,
    dealExplanation: explainBudgetFlightOnly({
      flightUsd: c.flightUsd,
      budgetUsd: input.budgetUsd,
      valueScore: scores[idx]!,
    }),
  }));

  enriched.sort((a, b) => b.valueScore - a.valueScore);
  const top = enriched.slice(0, 10).map(toPublicResult);

  return { ok: true, results: top, warnings };
}

type InternalCandidate = {
  destinationCityCode: string;
  destinationLabel: string;
  flightUsd: number;
  affiliateFlightsUrl: string;
};

function toPublicResult(
  row: InternalCandidate & { valueScore: number; dealExplanation: string },
): PublicDestinationResult {
  return {
    destinationCityCode: row.destinationCityCode,
    destinationLabel: row.destinationLabel,
    flightUsd: row.flightUsd,
    valueScore: row.valueScore,
    dealExplanation: row.dealExplanation,
    affiliateFlightsUrl: row.affiliateFlightsUrl,
  };
}
