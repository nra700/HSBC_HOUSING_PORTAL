import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true"><span className="sr-only">Loading market data</span>
      <Skeleton className="mb-6 h-8 w-80" />
      <Skeleton className="mb-6 h-40" />
      <div className="grid gap-4 sm:grid-cols-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}
