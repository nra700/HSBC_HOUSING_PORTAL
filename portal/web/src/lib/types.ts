import type { FeatureKey } from "./features";

export type Inputs = Record<FeatureKey, number>;

export interface EstimateRecord {
  id: number;
  created_at: string;
  label: string | null;
  inputs: Inputs;
  predicted_price_usd: number;
}

export interface CompareItem {
  label: string;
  inputs: Inputs;
  predicted_price_usd: number;
  diff_vs_first_usd: number;
  diff_vs_first_pct: number | null;
}
export interface CompareResult {
  items: CompareItem[];
  highest: number;
  lowest: number;
}

export interface ModelInfo {
  model_type: string;
  coefficients: Record<FeatureKey, number>;
  feature_means: Record<FeatureKey, number>;
  baseline_price: number;
  intercept: number;
  metrics: { r2: number; rmse: number; mae: number; cv_r2_mean: number };
  data_source: string;
}

export interface Bin { label: string; from: number; to: number; count: number }
export interface Summary {
  count: number; meanPrice: number; medianPrice: number; p10Price: number; p90Price: number;
  minPrice: number; maxPrice: number; meanSquareFootage: number; meanSchoolRating: number; priceHistogram: Bin[];
}
export interface Segment { label: string; count: number; meanPrice: number; medianPrice: number }
export interface MarketRow {
  id: number; squareFootage: number; bedrooms: number; bathrooms: number; yearBuilt: number;
  lotSize: number; distanceToCityCentre: number; schoolRating: number; price: number;
}
export interface PageOf<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }

export interface WhatIfResult {
  feature: string;
  basePriceUsd: number;
  points: { value: number; predictedPriceUsd: number }[];
}

export interface Filters {
  minPrice?: string; maxPrice?: string; minSqft?: string; maxSqft?: string; minBedrooms?: string;
  maxBedrooms?: string; minYear?: string; maxYear?: string; minSchool?: string; maxDistance?: string;
}
