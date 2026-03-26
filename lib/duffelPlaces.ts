export type DuffelPlaceSuggestion = {
  type?: string;
  name?: string;
  iata_code?: string;
  iata_city_code?: string;
  city_name?: string;
  iata_country_code?: string;
};

export type DuffelPlacesResponse = {
  data?: DuffelPlaceSuggestion[];
};

/**
 * Calls Duffel Places suggestions so users can type "Atlanta" instead of memorizing
 * IATA codes. Results are airports and cities you can feed into offer requests.
 */
export async function fetchDuffelPlaceSuggestions(input: {
  token: string;
  query: string;
}): Promise<DuffelPlaceSuggestion[]> {
  const q = input.query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({ query: q });
  const url = `https://api.duffel.com/places/suggestions?${params}`;
  console.log("[Duffel] GET places/suggestions", Object.fromEntries(params));

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${input.token}`,
    },
  });

  const json = (await res.json()) as DuffelPlacesResponse & { errors?: unknown };
  console.log("[Duffel] places/suggestions response count", json.data?.length ?? 0);

  if (!res.ok) return [];
  return json.data ?? [];
}
