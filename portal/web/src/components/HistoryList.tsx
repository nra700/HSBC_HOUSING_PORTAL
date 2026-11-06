"use client";

import { Button, Card } from "@/components/ui";
import { formatDate, formatUsd } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";

interface Props {
  items: EstimateRecord[];
  selectedId?: number;
  onSelect: (e: EstimateRecord) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
  busy: boolean;
}

export function HistoryList({ items, selectedId, onSelect, onDelete, onClear, busy }: Props) {
  return (
    <Card title="History" actions={items.length > 0 && <Button variant="danger" onClick={onClear} disabled={busy} className="!px-3 !py-1">Clear all</Button>}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">No estimates yet. Submit the form to create your first one.</p>
      ) : (
        <ul className="divide-y divide-slate-100" aria-label="Previous estimates">
          {items.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2">
              <button
                type="button"
                onClick={() => onSelect(e)}
                aria-pressed={selectedId === e.id}
                className="flex-1 rounded-md px-2 py-1 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700 aria-pressed:bg-brand-50"
              >
                <span className="block text-sm font-semibold">{formatUsd(e.predicted_price_usd)}{e.label && <span className="font-normal text-slate-700"> · {e.label}</span>}</span>
                <span className="block text-xs text-slate-600">{formatDate(e.created_at)}</span>
              </button>
              <Button variant="ghost" onClick={() => onDelete(e.id)} disabled={busy} aria-label={`Delete estimate ${formatUsd(e.predicted_price_usd)} from ${formatDate(e.created_at)}`} className="!px-2 !py-1">✕</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
