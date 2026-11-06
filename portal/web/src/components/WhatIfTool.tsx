"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, ErrorState, Field } from "@/components/ui";
import { marketApi } from "@/lib/api";
import { DEFAULT_PROPERTY, FEATURES, type FeatureKey } from "@/lib/features";
import { formatNumber, formatUsd, formatUsdCompact } from "@/lib/format";

/** Sweeps one feature across a range while holding the others fixed, using the Java backend + ML model. */
export function WhatIfTool({ defaults }: { defaults: Partial<Record<FeatureKey, number>> }) {
  const start = { ...DEFAULT_PROPERTY, ...defaults };
  const [base, setBase] = useState<Record<FeatureKey, string>>(
    Object.fromEntries(FEATURES.map((f) => [f.key, String(start[f.key])])) as Record<FeatureKey, string>);
  const [feature, setFeature] = useState<FeatureKey>("square_footage");
  const meta = FEATURES.find((f) => f.key === feature)!;
  const [from, setFrom] = useState(String(meta.sweep[0]));
  const [to, setTo] = useState(String(meta.sweep[1]));
  const [formError, setFormError] = useState("");

  const run = useMutation({ mutationFn: marketApi.whatIf });

  function chooseFeature(k: FeatureKey) {
    const m = FEATURES.find((f) => f.key === k)!;
    setFeature(k);
    setFrom(String(m.sweep[0]));
    setTo(String(m.sweep[1]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nums = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Number(v)]));
    const bad = FEATURES.find((f) => !Number.isFinite(nums[f.key]) || nums[f.key] < f.min || nums[f.key] > f.max);
    if (bad) return setFormError(`${bad.label} must be between ${bad.min} and ${bad.max}.`);
    const [a, b] = [Number(from), Number(to)];
    if (!(a < b)) return setFormError("“From” must be less than “To”.");
    if (a < meta.min || b > meta.max) return setFormError(`${meta.label} range must stay within ${meta.min} to ${meta.max}.`);
    setFormError("");
    run.mutate({ base: nums, feature, from: a, to: b, steps: 20 });
  }

  const result = run.data;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card title="Scenario">
        <form onSubmit={submit} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Field key={f.key} label={f.label} unit={f.unit} type="number" step="any" value={base[f.key]}
                onChange={(e) => setBase((b) => ({ ...b, [f.key]: e.target.value }))} />
            ))}
          </div>
          <fieldset className="mt-5 rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold">Vary one feature</legend>
            <label htmlFor="whatif-feature" className="block text-sm font-medium">Feature</label>
            <select id="whatif-feature" value={feature} onChange={(e) => chooseFeature(e.target.value as FeatureKey)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700">
              {FEATURES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="From" type="number" step="any" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Field label="To" type="number" step="any" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </fieldset>
          {formError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{formError}</p>}
          <Button type="submit" className="mt-4" loading={run.isPending}>Run analysis</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {run.isError && <ErrorState message={run.error.message} onRetry={() => run.reset()} />}
        {!result && !run.isError && <Card><p className="text-slate-700">Pick a feature and a range, then run the analysis to see how the estimated price responds.</p></Card>}
        {result && (
          <Card title={`Effect of ${meta.label} on price`}>
            <p className="text-sm text-slate-700">Baseline (current inputs): <strong>{formatUsd(result.basePriceUsd)}</strong></p>
            <div role="img" aria-label={`Line chart of estimated price as ${meta.label} changes. Exact values are in the table below.`} className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" tickFormatter={(v) => formatNumber(v, 1)} />
                  <YAxis tickFormatter={formatUsdCompact} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => formatUsd(v)} labelFormatter={(l) => `${meta.label}: ${formatNumber(Number(l))}`} />
                  <ReferenceLine y={result.basePriceUsd} stroke="#6b7280" strokeDasharray="4 4" label={{ value: "baseline", fontSize: 11 }} />
                  <Line type="monotone" dataKey="predictedPriceUsd" stroke="#4338ca" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-brand-800">Show values as a table</summary>
              <table className="mt-2 w-full text-left text-sm">
                <thead className="text-slate-600"><tr><th scope="col" className="py-1">{meta.label}</th><th scope="col" className="py-1 text-right">Estimated price</th></tr></thead>
                <tbody>{result.points.map((p) => <tr key={p.value} className="border-t border-slate-100"><td className="py-1 tabular-nums">{formatNumber(p.value)}</td><td className="py-1 text-right tabular-nums">{formatUsd(p.predictedPriceUsd)}</td></tr>)}</tbody>
              </table>
            </details>
          </Card>
        )}
      </div>
    </div>
  );
}
