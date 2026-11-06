export const FILTER_KEYS = ["minPrice", "maxPrice", "minSqft", "maxSqft", "minBedrooms", "maxBedrooms", "minYear", "maxYear", "minSchool", "maxDistance"] as const;
export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Pull only the known filter params out of a Next.js searchParams object. */
export function pickFilters(sp: SearchParams): Record<string, string | undefined> {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, first(sp[k]) || undefined]));
}

export function describeFilters(f: Record<string, string | undefined>) {
  return Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(", ");
}

export function toQuery(f: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) u.set(k, v);
  return u.toString();
}
