/**
 * Value Score answers: "for what I pay, how much city quality do I get?"
 * We combine Teleport quality with total trip cost, then re-scale 0–100 within
 * this result set so the best option in the batch reads as "100".
 */

export type ScoringRow = {
  teleportAverage: number;
  totalUsd: number;
};

/**
 * Raw efficiency: higher means more Teleport points per dollar spent.
 * We clamp cost so divide-by-zero never happens on bad API data.
 */
export function rawValueEfficiency(row: ScoringRow): number {
  const cost = Math.max(row.totalUsd, 1);
  return row.teleportAverage / cost;
}

/**
 * Turns raw efficiencies into user-facing integers 0–100 for badges.
 * The top destination in the list always scores 100; others are proportional.
 */
export function normalizeValueScores(efficiencies: number[]): number[] {
  const max = Math.max(...efficiencies, 1e-9);
  return efficiencies.map((e) => Math.round(Math.min(100, (e / max) * 100)));
}

/**
 * One or two short sentences that explain the score in plain English so the
 * UI is not only numbers.
 */
export function explainDeal(input: {
  totalUsd: number;
  budgetUsd: number;
  valueScore: number;
  teleportAverage: number;
}): string {
  const headroom = input.budgetUsd - input.totalUsd;
  const tight = headroom < input.budgetUsd * 0.08;
  const roomy = headroom > input.budgetUsd * 0.2;

  const quality =
    input.teleportAverage >= 7.8
      ? "This city scores very well on livability signals we could find."
      : input.teleportAverage >= 6.5
        ? "City quality looks solid overall."
        : "City quality is mixed—worth reading Teleport breakdowns before you book.";

  if (tight) {
    return `${quality} You are close to your budget cap, so flexibility on dates helps.`;
  }
  if (roomy) {
    return `${quality} You still have meaningful budget left for meals, tours, or a room upgrade.`;
  }
  return `${quality} This fits your budget with a typical cushion for daily spend.`;
}

/**
 * Plain-English copy for the budget explorer when we only rank on flight price
 * vs. the traveler’s total budget (no hotel model, no city-quality API).
 */
export function explainBudgetFlightOnly(input: {
  flightUsd: number;
  budgetUsd: number;
  valueScore: number;
}): string {
  const headroom = input.budgetUsd - input.flightUsd;
  const tight = headroom < input.budgetUsd * 0.08;
  const roomy = headroom > input.budgetUsd * 0.2;
  if (tight) {
    return "This round-trip flight quote sits close to your budget cap—small date shifts may unlock cheaper options.";
  }
  if (roomy) {
    return "This flight leaves comfortable room under your total budget for hotels, food, and activities.";
  }
  return "This flight fits your budget with a typical cushion left for the rest of the trip.";
}

/**
 * Higher score when more budget remains per dollar of airfare (cheap + roomy).
 */
export function rawBudgetFlightEfficiency(input: { flightUsd: number; budgetUsd: number }): number {
  const fare = Math.max(input.flightUsd, 1);
  const headroom = Math.max(0, input.budgetUsd - input.flightUsd);
  return headroom / fare;
}
