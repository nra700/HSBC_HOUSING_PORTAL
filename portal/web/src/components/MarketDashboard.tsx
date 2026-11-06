"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Stat } from "@/components/ui";
import { formatUsd, formatUsdCompact } from "@/lib/format";
import type { Segment, Summary } from "@/lib/types";

type Dim = "size" | "age" | "distance" | "school";
const DIMS: { id: Dim; label: string }[] = [
  { id: "size", label: "Size" }, { id: "age", label: "Year built" }, { id: "distance", label: "Distance" }, { id: "school", label: "Schools" },
];

interface Props { summary: Summary; segments: Record<Dim, Segment[]> }

export function MarketDashboard({ summary, segments }: Props) {
  const [dim, setDim] = useState<Dim>("size");

  if (summary.count === 0) {
    return <Card><p role="status">No properties match these filters. Try widening them.</p></Card>;
  }
  const seg = segments[dim];
  return (
    <div className="space-y-6">
      <Card title={`Overview · ${summary.count.toLocaleString()} properties`}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Mean price" value={formatUsd(summary.meanPrice)} />
          <Stat label="Median price" value={formatUsd(summary.medianPrice)} />
          <Stat label="Typical range (P10–P90)" value={`${formatUsdCompact(summary.p10Price)} – ${formatUsdCompact(summary.p90Price)}`} />
          <Stat label="Mean size" value={`${Math.round(summary.meanSquareFootage).toLocaleString()} sq ft`} />
        </dl>
      </Card>

      <Card title="Price distribution">
        <div role="img" aria-label="Histogram of property prices in the selected segment" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.priceHistogram}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Properties" fill="#4338ca" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        title="Price by segment"
        actions={
          <div role="group" aria-label="Segment by" className="inline-flex rounded-md ring-1 ring-slate-300">
            {DIMS.map((d) => (
              <button key={d.id} type="button" aria-pressed={dim === d.id} onClick={() => setDim(d.id)}
                className="px-3 py-1.5 text-sm first:rounded-l-md last:rounded-r-md aria-pressed:bg-brand-700 aria-pressed:text-white hover:bg-slate-50 aria-pressed:hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700">
                {d.label}
              </button>
            ))}
          </div>
        }
      >
        <div role="img" aria-label={`Bar chart of mean and median price by ${dim}. Exact values are in the table below.`} className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seg}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={formatUsdCompact} />
              <Tooltip formatter={(v: number) => formatUsd(v)} />
              <Legend />
              <Bar dataKey="meanPrice" name="Mean" fill="#4338ca" isAnimationActive={false} />
              <Bar dataKey="medianPrice" name="Median" fill="#0e7490" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Price statistics by {dim}</caption>
            <thead className="border-b border-slate-200 text-slate-600">
              <tr><th scope="col" className="py-2">Segment</th><th scope="col" className="py-2 text-right">Properties</th><th scope="col" className="py-2 text-right">Mean</th><th scope="col" className="py-2 text-right">Median</th></tr>
            </thead>
            <tbody>
              {seg.map((s) => (
                <tr key={s.label} className="border-b border-slate-100">
                  <th scope="row" className="py-2 font-normal">{s.label}</th>
                  <td className="py-2 text-right tabular-nums">{s.count.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{formatUsd(s.meanPrice)}</td>
                  <td className="py-2 text-right tabular-nums">{formatUsd(s.medianPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
