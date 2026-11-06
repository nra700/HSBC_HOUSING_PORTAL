"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PropertyInput } from "@/lib/features";

export const MAX_COMPARE = 6;

interface CompareState {
  items: PropertyInput[];
  add: (p: PropertyInput) => boolean;
  remove: (index: number) => void;
  clear: () => void;
}

/** The comparison basket survives page navigation and reloads (localStorage). */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p) => {
        if (get().items.length >= MAX_COMPARE) return false;
        set((s) => ({ items: [...s.items, p] }));
        return true;
      },
      remove: (index) => set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
      clear: () => set({ items: [] }),
    }),
    { name: "compare-basket" },
  ),
);
