"use client";

import { useRef } from "react";
import { Button, Card, Field, Spinner } from "@/components/ui";
import { FILTER_KEYS } from "@/lib/filters";
import { useUrlFilters } from "@/hooks/useUrlFilters";

const NUMERIC = [
  { key: "minPrice", label: "Min price", unit: "$" }, { key: "maxPrice", label: "Max price", unit: "$" },
  { key: "minSqft", label: "Min square footage", unit: "sq ft" }, { key: "maxSqft", label: "Max square footage", unit: "sq ft" },
  { key: "minBedrooms", label: "Min bedrooms", unit: "" }, { key: "maxBedrooms", label: "Max bedrooms", unit: "" },
  { key: "minYear", label: "Built after", unit: "year" }, { key: "maxYear", label: "Built before", unit: "year" },
  { key: "minSchool", label: "Min school rating", unit: "0–10" }, { key: "maxDistance", label: "Max distance", unit: "km" },
] as const;

export function FilterBar() {
  const { params, setFilters, reset, isPending } = useUrlFilters();
  const formRef = useRef<HTMLFormElement>(null);
  const paramKey = FILTER_KEYS.map((k) => params.get(k) ?? "").join("|"); // remount inputs when the URL changes

  const apply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFilters(Object.fromEntries(FILTER_KEYS.map((k) => [k, (fd.get(k) as string) || undefined])));
  };

  return (
    <Card title="Filter segments" className="mb-6">
      <form key={paramKey} ref={formRef} onSubmit={apply} aria-busy={isPending}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NUMERIC.map((f) => (
            <Field key={f.key} name={f.key} label={f.label} unit={f.unit || undefined} type="number" min={0} step="any" defaultValue={params.get(f.key) ?? ""} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" loading={isPending}>Apply filters</Button>
          <Button type="button" variant="secondary" onClick={reset} disabled={isPending}>Reset</Button>
          {isPending && <Spinner label="Updating" />}
        </div>
      </form>
    </Card>
  );
}
