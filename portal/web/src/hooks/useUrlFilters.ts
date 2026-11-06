"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Keeps filter state in the URL so views are shareable and server components can read it.
 * `isPending` is true while the server re-renders with the new filters.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setFilters = useCallback(
    (next: Record<string, string | undefined>) => {
      const q = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) (v ? q.set(k, v) : q.delete(k));
      q.delete("page"); // a new filter always restarts paging
      startTransition(() => router.replace(`${pathname}?${q.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  const reset = useCallback(() => {
    startTransition(() => router.replace(pathname, { scroll: false }));
  }, [pathname, router]);

  return { params, setFilters, reset, isPending };
}
