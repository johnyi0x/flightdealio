/** Teleport is a public HTTP API—no API key. We use it to turn city names into
 *  simple 0–10 quality averages so the Value Score is not "price only".
 */

export type TeleportScoresPayload = {
  categories?: Array<{ name: string; score_out_of_10: number }>;
};

/**
 * Average every `score_out_of_10` we can find. If Teleport changes shape, this
 * still returns a conservative default instead of crashing the whole search.
 */
export function averageTeleportScores(payload: TeleportScoresPayload): number {
  const scores =
    payload.categories?.map((c) => c.score_out_of_10).filter(Number.isFinite) ??
    [];
  if (scores.length === 0) return 6;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Follow Teleport HATEOAS links from a city search string to the scores doc.
 * We log each hop because beginners learn faster when the terminal narrates.
 */
export async function fetchTeleportAverageForCitySearch(
  searchQuery: string,
): Promise<number> {
  const searchUrl = `https://api.teleport.org/api/cities/?search=${encodeURIComponent(
    searchQuery,
  )}`;
  console.log("[Teleport] GET cities search", { searchUrl });
  const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
  const searchJson: unknown = await searchRes.json();
  console.log("[Teleport] cities search response", searchJson);

  const firstHref = extractFirstCityItemHref(searchJson);
  if (!firstHref) return 6;

  console.log("[Teleport] GET city item", { firstHref });
  const cityRes = await fetch(firstHref, { next: { revalidate: 0 } });
  const cityJson: unknown = await cityRes.json();
  console.log("[Teleport] city item response", cityJson);

  const urbanAreaHref = extractLinkHref(cityJson, "city:urban_area");
  if (!urbanAreaHref) return 6;

  console.log("[Teleport] GET urban area", { urbanAreaHref });
  const uaRes = await fetch(urbanAreaHref, { next: { revalidate: 0 } });
  const uaJson: unknown = await uaRes.json();
  console.log("[Teleport] urban area response", uaJson);

  const scoresHref = extractLinkHref(uaJson, "ua:scores");
  if (!scoresHref) return 6;

  console.log("[Teleport] GET scores", { scoresHref });
  const scoresRes = await fetch(scoresHref, { next: { revalidate: 0 } });
  const scoresJson = (await scoresRes.json()) as TeleportScoresPayload;
  console.log("[Teleport] scores response", scoresJson);

  return averageTeleportScores(scoresJson);
}

/**
 * Teleport nests links under `_links[rel].href`; this helper keeps the main
 * flow readable and null-safe when a hop is missing.
 */
function extractLinkHref(obj: unknown, rel: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const links = (obj as { _links?: Record<string, { href?: string }> })._links;
  const href = links?.[rel]?.href;
  return typeof href === "string" ? href : null;
}

/**
 * Grabs the first city detail URL from a search payload because Teleport search
 * only returns summaries; we need the city document to reach urban-area scores.
 */
function extractFirstCityItemHref(searchJson: unknown): string | null {
  const embedded = (searchJson as { _embedded?: Record<string, unknown> })
    ._embedded;
  const results = embedded?.["city:search-results"];
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0] as { _links?: Record<string, { href?: string }> };
  return first?._links?.["city:item"]?.href ?? null;
}
