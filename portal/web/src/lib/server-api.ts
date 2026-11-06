import "server-only";

/** Server-component data fetching (runs on the Next server, talks to backends directly). */
const ESTIMATOR = process.env.ESTIMATOR_API_URL ?? "http://localhost:8001";
const MARKET = process.env.MARKET_API_URL ?? "http://localhost:8002";

type Opts = { revalidate?: number };

async function get<T>(base: string, path: string, { revalidate }: Opts = {}): Promise<T> {
  const res = await fetch(`${base}${path}`, revalidate ? { next: { revalidate } } : { cache: "no-store" });
  if (!res.ok) {
    // Thrown errors are caught by the nearest error.tsx boundary.
    throw new Error(`Backend request ${path} failed (${res.status}). Is the service running?`);
  }
  return res.json() as Promise<T>;
}

export const estimatorServer = {
  history: () => get<import("./types").EstimateRecord[]>(ESTIMATOR, "/api/estimates"),
  health: () => get<{ status: string; model_service: boolean }>(ESTIMATOR, "/api/health"),
};

const qs = (params: Record<string, string | undefined>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  const s = u.toString();
  return s ? `?${s}` : "";
};

export const marketServer = {
  // Market data changes only when the dataset does, so cache briefly.
  summary: (f: Record<string, string | undefined>) =>
    get<import("./types").Summary>(MARKET, `/api/market/summary${qs(f)}`, { revalidate: 60 }),
  segments: (by: string, f: Record<string, string | undefined>) =>
    get<import("./types").Segment[]>(MARKET, `/api/market/segments${qs({ ...f, by })}`, { revalidate: 60 }),
  properties: (p: Record<string, string | undefined>) =>
    get<import("./types").PageOf<import("./types").MarketRow>>(MARKET, `/api/market/properties${qs(p)}`, { revalidate: 60 }),
  health: () => get<{ status: string }>(MARKET, "/actuator/health"),
};
