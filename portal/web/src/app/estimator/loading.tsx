import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true"><span className="sr-only">Loading estimator</span>
      <Skeleton className="mb-6 h-8 w-72" />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]"><Skeleton className="h-96" /><Skeleton className="h-64" /></div>
    </div>
  );
}
