/**
 * Picks the 15th of the selected month in UTC so hotel pricing always lands
 * inside the month you chose without dealing with variable month lengths yet.
 */
export function midMonthDateIso(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) throw new Error("month must be YYYY-MM");
  const d = new Date(Date.UTC(y, m - 1, 15));
  return d.toISOString().slice(0, 10);
}

/**
 * Adds whole days to a YYYY-MM-DD string using UTC math so checkout dates stay
 * correct even when local clocks jump for daylight saving time.
 */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
