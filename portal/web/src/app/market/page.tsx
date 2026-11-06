import type { Metadata } from "next";
import { ExportButtons } from "@/components/ExportButtons";
import { FilterBar } from "@/components/FilterBar";
import { MarketDashboard } from "@/components/MarketDashboard";
import { PageHeader } from "@/components/ui";
import { pickFilters, type SearchParams } from "@/lib/filters";
import { marketServer } from "@/lib/server-api";

export const metadata: Metadata = { title: "Market Analysis" };

export default async function MarketPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = pickFilters(searchParams);
  // Independent requests run in parallel.
  const [summary, size, age, distance, school] = await Promise.all([
    marketServer.summary(filters),
    marketServer.segments("size", filters),
    marketServer.segments("age", filters),
    marketServer.segments("distance", filters),
    marketServer.segments("school", filters),
  ]);
  return (
    <>
      <PageHeader title="Property Market Analysis" description="Explore price patterns across the housing dataset. Filters are kept in the URL, so you can share a view." />
      <FilterBar />
      <div className="mb-4"><ExportButtons summary={summary} filters={filters} /></div>
      <MarketDashboard summary={summary} segments={{ size, age, distance, school }} />
    </>
  );
}
