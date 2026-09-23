import { Skeleton } from "./feedback";

/** Two-column detail page placeholder (request, order, marketplace detail). */
export function DetailSkeleton({ aside = "right" }: { aside?: "right" | "chat" }) {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-8 h-5 w-40" />
      <Skeleton className="mt-4 h-12 w-3/4 max-w-xl" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Skeleton className="h-40 rounded-[var(--radius-card)]" />
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        </div>
        <Skeleton className={aside === "chat" ? "hidden h-[36rem] rounded-[var(--radius-card)] lg:block" : "h-96 rounded-[var(--radius-card)]"} />
      </div>
    </div>
  );
}
