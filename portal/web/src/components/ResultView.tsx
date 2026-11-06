"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Spinner } from "@/components/ui";
import { estimatorApi } from "@/lib/api";
import { FEATURES } from "@/lib/features";
import { formatNumber, formatUsd, formatUsdCompact } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";

/** Shows one estimate as a table (exact numbers) and a chart (what pushed the price up or down). */
export function ResultView({ estimate }: { estimate: EstimateRecord }) {
  const { data: model, isLoading, error } = useQuery({ queryKey: ["model-info"], queryFn: estimatorApi.modelInfo, staleTime: 5 * 60_000 });

  const rows = FEATURES.map((f) => ({
    name: f.label, key: f.key, value: estimate.inputs[f.key],
    // Effect on price versus an average house in the training data.
    contribution: model ? model.coefficients[f.key] * (estimate.inputs[f.key] - model.feature_means[f.key]) : null,
  }));
  const chartData = model
    ? [{ name: "Average house", contribution: model.baseline_price }, ...rows.map((r) => ({ name: r.name, contribution: r.contribution as number }))]
    : [];

  return (
    <Card title={`Estimate${estimate.label ? ` · ${estimate.label}` : ""}`}>
      <p className="text-sm text-slate-600">Predicted value</p>
      <p className="text-4xl font-bold text-brand-800" data-testid="predicted-price">{formatUsd(estimate.predicted_price_usd)}</p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Inputs and each feature’s effect on the estimate compared with an average house</caption>
          <thead className="border-b border-slate-200 text-slate-600">
            <tr><th scope="col" className="py-2 pr-4">Feature</th><th scope="col" className="py-2 pr-4 text-right">Value</th><th scope="col" className="py-2 text-right">Effect vs. average</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-100">
                <th scope="row" className="py-2 pr-4 font-normal">{r.name}</th>
                <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(r.value)}</td>
                <td className="py-2 text-right tabular-nums">{r.contribution === null ? "…" : formatUsd(r.contribution)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-semibold">What drives this estimate (vs. an average house)</h3>
      {isLoading && <Spinner label="Loading chart" />}
      {error && <p role="alert" className="text-sm text-red-700">Couldn’t load model details for the chart.</p>}
      {model && (
        <div role="img" aria-label="Bar chart of each feature’s dollar effect on the estimate, starting from the average house price. Exact values are in the table above." className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatUsdCompact} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatUsd(v)} />
              <Bar dataKey="contribution" isAnimationActive={false}>
                {chartData.map((d) => <Cell key={d.name} fill={d.contribution >= 0 ? "#4338ca" : "#b91c1c"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
