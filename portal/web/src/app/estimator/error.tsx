"use client";

import { ErrorState } from "@/components/ui";

export default function EstimatorError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="The Value Estimator is unavailable" message={error.message} onRetry={reset} />;
}
