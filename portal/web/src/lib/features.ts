import { z } from "zod";

/** Keys match the CSV columns and the model API's JSON field names exactly. */
export const FEATURES = [
  { key: "square_footage", label: "Square footage", unit: "sq ft", min: 200, max: 20000, step: 10, def: 1800, sweep: [800, 4000], hint: "Interior living area." },
  { key: "bedrooms", label: "Bedrooms", unit: "", min: 0, max: 15, step: 1, def: 3, sweep: [1, 7], hint: "Number of bedrooms." },
  { key: "bathrooms", label: "Bathrooms", unit: "", min: 0.5, max: 12, step: 0.5, def: 2, sweep: [1, 5], hint: "Number of bathrooms (0.5 = half bath)." },
  { key: "year_built", label: "Year built", unit: "", min: 1800, max: 2026, step: 1, def: 1995, sweep: [1950, 2024], hint: "Year the house was built." },
  { key: "lot_size", label: "Lot size", unit: "sq ft", min: 0, max: 200000, step: 100, def: 6000, sweep: [1000, 20000], hint: "Size of the lot." },
  { key: "distance_to_city_centre", label: "Distance to city centre", unit: "km", min: 0, max: 200, step: 0.5, def: 8, sweep: [0.5, 40], hint: "Distance from the city centre." },
  { key: "school_rating", label: "School rating", unit: "0–10", min: 0, max: 10, step: 0.1, def: 7, sweep: [1, 10], hint: "Local school rating, 10 is best." },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

const num = (f: (typeof FEATURES)[number]) =>
  z
    .number({ invalid_type_error: `${f.label} is required` })
    .min(f.min, `${f.label} must be at least ${f.min}`)
    .max(f.max, `${f.label} must be at most ${f.max}`);

const numberShape = Object.fromEntries(FEATURES.map((f) => [f.key, num(f)])) as Record<FeatureKey, z.ZodNumber>;

export const propertySchema = z.object({
  label: z.string().max(60, "Label must be 60 characters or fewer").optional(),
  ...numberShape,
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const DEFAULT_PROPERTY = Object.fromEntries(FEATURES.map((f) => [f.key, f.def])) as Record<FeatureKey, number>;
