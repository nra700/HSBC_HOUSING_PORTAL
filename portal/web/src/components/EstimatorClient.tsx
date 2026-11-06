"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui";
import { HistoryList } from "@/components/HistoryList";
import { PropertyForm } from "@/components/PropertyForm";
import { ResultView } from "@/components/ResultView";
import { estimatorApi } from "@/lib/api";
import type { PropertyInput } from "@/lib/features";
import type { EstimateRecord } from "@/lib/types";
import { MAX_COMPARE, useCompareStore } from "@/store/compare";
import { useHydrated } from "@/hooks/useHydrated";

const HISTORY_KEY = ["history"];

/** `initialHistory` was fetched by the server component, so first paint already has data. */
export function EstimatorClient({ initialHistory }: { initialHistory: EstimateRecord[] }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<EstimateRecord | undefined>(initialHistory[0]);
  const [formValues, setFormValues] = useState<PropertyInput>();
  const [notice, setNotice] = useState("");
  const basket = useCompareStore();
  const hydrated = useHydrated();

  const { data: history = [] } = useQuery({ queryKey: HISTORY_KEY, queryFn: estimatorApi.list, initialData: initialHistory });

  const create = useMutation({
    mutationFn: estimatorApi.create,
    onSuccess: (rec) => {
      qc.setQueryData<EstimateRecord[]>(HISTORY_KEY, (old = []) => [rec, ...old]);
      setSelected(rec);
    },
  });
  const remove = useMutation({
    mutationFn: estimatorApi.remove,
    onSuccess: (_, id) => {
      qc.setQueryData<EstimateRecord[]>(HISTORY_KEY, (old = []) => old.filter((e) => e.id !== id));
      setSelected((s) => (s?.id === id ? undefined : s));
    },
  });
  const clear = useMutation({
    mutationFn: estimatorApi.clear,
    onSuccess: () => { qc.setQueryData(HISTORY_KEY, []); setSelected(undefined); },
  });

  const addToCompare = (p: PropertyInput) => {
    const ok = basket.add({ ...p, label: p.label || `Property ${basket.items.length + 1}` });
    setNotice(ok ? "Added to the comparison basket." : `Basket is full (max ${MAX_COMPARE}).`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-6">
        <Card title="Property details">
          <PropertyForm
            values={formValues}
            onSubmit={(p) => create.mutateAsync(p)}
            onAddToCompare={addToCompare}
            basketFull={hydrated && basket.items.length >= MAX_COMPARE}
          />
          <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-slate-700">{notice}</p>
        </Card>
        {selected && <ResultView estimate={selected} />}
      </div>

      <HistoryList
        items={history}
        selectedId={selected?.id}
        busy={remove.isPending || clear.isPending}
        onSelect={(e) => { setSelected(e); setFormValues({ ...e.inputs, label: e.label ?? "" }); }}
        onDelete={(id) => remove.mutate(id)}
        onClear={() => { if (confirm("Delete all history?")) clear.mutate(); }}
      />
    </div>
  );
}
