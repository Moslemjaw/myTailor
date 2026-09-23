import { Skeleton } from "@/components/ui/feedback";

export default function Loading() {
  return (
    <div aria-busy="true" className="-mx-4 -mt-6 sm:mx-0 sm:mt-0">
      <span className="sr-only">Loading conversation…</span>
      <Skeleton className="h-[calc(100dvh-9rem)] rounded-none sm:rounded-[var(--radius-card)]" />
    </div>
  );
}
