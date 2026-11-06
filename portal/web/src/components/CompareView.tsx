"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";
import { estimatorApi } from "@/lib/api";
import { FEATURES } from "@/lib/features";
import { formatNumber, formatUsd, formatUsdCompact } from "@/lib/format";
import { useHydrated } from "@/hooks/useHydrated";
import { useCompareStore } from "@/store/compare";

export function CompareView() {
  const hydrated = useHydrated();
  const { items, remove, clear } = useCompareStore();
  const compare = useMutation({ mutationFn: estimatorApi.compare });

  // Re-run whenever the basket changes (once it has at least two properties).
  useEffect(() => {
    if (hydrated && items.length >= 2) compare.mutate(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items]);

  if (!hydrated) return <Spinner />;

  if (items.length < 2) {
    return (
      <Card>
        <p>Add at least two properties to compare them. You have {items.length}.</p>
        <Link href="/estimator" className="mt-3 inline-block font-medium text-brand-700 underline">Go to the estimator</Link>
      </Card>
    );
  }

  const result = compare.data;
  return (
    <div className="space-y-6">
      {compare.isError && <ErrorState message={compare.error.message} onRetry={() => compare.mutate(items)} />}
      <Card
        title={`Comparing ${items.length} properties`}
        actions={<Button variant="danger" className="!px-3 !py-1" onClick={clear}>Clear basket</Button>}
      >
        <div className="overflow-x-auto" aria-busy={compare.isPending}>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Side-by-side property comparison</caption>
            <thead>
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-2 pr-4 text-slate-600">Feature</th>
                {items.map((p, i) => (
                  <th key={i} scope="col" className="py-2 pr-4 text-right">
                    <span className="block">{p.label || `Property ${i + 1}`}</span>
                    <button type="button" onClick={() => remove(i)} className="text-xs font-normal text-red-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700" aria-label={`Remove ${p.label || `property ${i + 1}`}`}>remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.key} className="border-b border-slate-100">
                  <th scope="row" className="py-2 pr-4 font-normal">{f.label}</th>
                  {items.map((p, i) => <td key={i} className="py-2 pr-4 text-right tabular-nums">{formatNumber(p[f.key])}</td>)}
                </tr>
              ))}
              <tr className="border-b border-slate-200 font-semibold">
                <th scope="row" className="py-2 pr-4">Estimated value</th>
                {items.map((_, i) => (
                  <td key={i} className="py-2 pr-4 text-right tabular-nums">
                    {result ? formatUsd(result.items[i].predicted_price_usd) : "…"}
                    {result && i === result.highest && <span className="ml-1 text-xs text-green-800">▲ highest</span>}
                    {result && i === result.lowest && <span className="ml-1 text-xs text-red-700">▼ lowest</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-4 font-normal">vs. first property</th>
                {items.map((_, i) => (
                  <td key={i} className="py-2 pr-4 text-right tabular-nums">
                    {!result ? "…" : i === 0 ? "—" : `${result.items[i].diff_vs_first_usd >= 0 ? "+" : ""}${formatUsd(result.items[i].diff_vs_first_usd)} (${result.items[i].diff_vs_first_pct}%)`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {result && (
        <Card title="Estimated value by property">
          <div role="img" aria-label="Bar chart comparing the estimated value of each property. Exact values are in the table above." className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.items.map((i) => ({ name: i.label, price: i.predicted_price_usd }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatUsdCompact} />
                <Tooltip formatter={(v: number) => formatUsd(v)} />
                <Bar dataKey="price" fill="#4338ca" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
