import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stars({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            size === "sm" ? "size-3.5" : "size-5",
            i <= rounded ? "fill-accent text-accent" : "fill-transparent text-sand",
          )}
        />
      ))}
    </span>
  );
}

/** "4.8 (12)" or "New tailor". */
export function RatingSummary({ avg, count, className }: { avg: number | null; count: number; className?: string }) {
  if (!count || avg == null) {
    return <span className={cn("text-xs font-medium text-muted", className)}>New to MyTailor</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Star className="size-3.5 fill-accent text-accent" aria-hidden />
      <span className="font-semibold text-ink">{Number(avg).toFixed(1)}</span>
      <span className="text-muted">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}
