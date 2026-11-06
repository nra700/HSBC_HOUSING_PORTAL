"use client";

import { ErrorState } from "@/components/ui";

export default function MarketError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Market Analysis is unavailable" message={error.message} onRetry={reset} />;
}
