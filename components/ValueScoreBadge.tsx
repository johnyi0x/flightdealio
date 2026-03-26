/**
 * Visual badge for the 0–100 score so cards stay scannable on mobile.
 */
export function ValueScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-700"
      : score >= 55
        ? "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-700"
        : "bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone}`}
    >
      Value {score}
    </span>
  );
}
