"use client";

import { ErrorState } from "@/components/ui";

/** Root error boundary: catches anything a nested error.tsx doesn't. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message={error.message} onRetry={reset} />;
}
