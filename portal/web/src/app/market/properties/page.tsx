import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/ui";
import { formatNumber, formatUsd } from "@/lib/format";
import { pickFilters, toQuery, type SearchParams } from "@/lib/filters";
import { marketServer } from "@/lib/server-api";

export const metadata: Metadata = { title: "Market data table" };

const COLUMNS = [
  { sort: "id", label: "ID" }, { sort: "squareFootage", label: "Sq ft" }, { sort: "bedrooms", label: "Beds" },
  { sort: "bathrooms", label: "Baths" }, { sort: "yearBuilt", label: "Built" }, { sort: "lotSize", label: "Lot (sq ft)" },
  { sort: "distanceToCityCentre", label: "Dist. (km)" }, { sort: "schoolRating", label: "School" }, { sort: "price", label: "Price" },
] as const;

const one = (v: string | string[] | undefined, d: string) => (Array.isArray(v) ? v[0] : v) ?? d;

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = pickFilters(searchParams);
  const sort = one(searchParams.sort, "price");
  const dir = one(searchParams.dir, "desc");
  const page = Number(one(searchParams.page, "0")) || 0;
  const data = await marketServer.properties({ ...filters, sort, dir, page: String(page), size: "25" });

  const href = (over: Record<string, string>) => `?${toQuery({ ...filters, sort, dir, page: "0", ...over })}`;

  return (
    <>
      <PageHeader title="Market data" description="Sort by clicking a column heading. Filters apply to the whole table." />
      <FilterBar />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Properties, {data.totalElements} results, sorted by {sort} {dir === "asc" ? "ascending" : "descending"}</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {COLUMNS.map((c) => {
                const active = sort === c.sort;
                return (
                  <th key={c.sort} scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"} className="px-3 py-2">
                    <Link href={href({ sort: c.sort, dir: active && dir === "desc" ? "asc" : "desc" })} className="inline-flex items-center gap-1 font-semibold hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700">
                      {c.label}<span aria-hidden>{active ? (dir === "asc" ? "▲" : "▼") : ""}</span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.content.length === 0 && <tr><td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-slate-600">No properties match these filters.</td></tr>}
            {data.content.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 tabular-nums">{r.id}</td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(r.squareFootage, 0)}</td>
                <td className="px-3 py-2 tabular-nums">{r.bedrooms}</td>
                <td className="px-3 py-2 tabular-nums">{r.bathrooms}</td>
                <td className="px-3 py-2 tabular-nums">{r.yearBuilt}</td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(r.lotSize, 0)}</td>
                <td className="px-3 py-2 tabular-nums">{r.distanceToCityCentre}</td>
                <td className="px-3 py-2 tabular-nums">{r.schoolRating}</td>
                <td className="px-3 py-2 font-medium tabular-nums">{formatUsd(r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
        <span role="status">Page {data.totalPages === 0 ? 0 : page + 1} of {data.totalPages} · {data.totalElements.toLocaleString()} results</span>
        <span className="flex gap-2">
          {page > 0 ? <Link className="rounded-md px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50" href={href({ page: String(page - 1) })}>Previous</Link> : <span aria-disabled className="rounded-md px-3 py-2 text-slate-500 ring-1 ring-slate-200">Previous</span>}
          {page + 1 < data.totalPages ? <Link className="rounded-md px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50" href={href({ page: String(page + 1) })}>Next</Link> : <span aria-disabled className="rounded-md px-3 py-2 text-slate-500 ring-1 ring-slate-200">Next</span>}
        </span>
      </nav>
    </>
  );
}
