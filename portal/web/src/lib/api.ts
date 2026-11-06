/** Browser-side API client. All calls go through the Next.js rewrites, so there is no CORS. */
import type { CompareResult, EstimateRecord, ModelInfo, WhatIfResult } from "./types";
import type { PropertyInput } from "./features";

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail, body.fields ?? {});
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const estimatorApi = {
  list: () => request<EstimateRecord[]>("/api/estimator/estimates"),
  create: (p: PropertyInput) => request<EstimateRecord>("/api/estimator/estimates", post(p)),
  remove: (id: number) => request<void>(`/api/estimator/estimates/${id}`, { method: "DELETE" }),
  clear: () => request<void>("/api/estimator/estimates", { method: "DELETE" }),
  compare: (properties: PropertyInput[]) => request<CompareResult>("/api/estimator/compare", post({ properties })),
  modelInfo: () => request<ModelInfo>("/api/estimator/model-info"),
};

export const marketApi = {
  whatIf: (req: { base: Record<string, number>; feature: string; from: number; to: number; steps: number }) =>
    request<WhatIfResult>("/api/market/what-if", post(req)),
};
