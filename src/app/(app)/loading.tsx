import { Skeleton } from "@/components/ui/feedback";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-11 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-4 w-1/2 max-w-sm" />
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <Skeleton className="size-20 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
