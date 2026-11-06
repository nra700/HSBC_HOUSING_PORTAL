"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { exportMarketPdf } from "@/lib/export";
import { describeFilters, toQuery } from "@/lib/filters";
import type { MarketRow, PageOf, Summary } from "@/lib/types";

export function ExportButtons({ summary, filters }: { summary: Summary; filters: Record<string, string | undefined> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const q = toQuery(filters);

  async function pdf() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/market/properties?${toQuery({ ...filters, size: "100", sort: "price", dir: "desc" })}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const page: PageOf<MarketRow> = await res.json();
      await exportMarketPdf(summary, page.content, describeFilters(filters));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={`/api/market/export.csv${q ? `?${q}` : ""}`} download
         className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
        Export CSV
      </a>
      <Button variant="secondary" onClick={pdf} loading={busy}>Export PDF</Button>
      {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
