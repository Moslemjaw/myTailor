import { Check } from "lucide-react";
import { ORDER_STEPS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

function stepIndex(status: OrderStatus) {
  return ORDER_STEPS.findIndex((s) => s.status === status);
}

/**
 * Accepted → In progress → Ready → Completed.
 * Horizontal on wide containers, vertical on phones.
 */
export function OrderProgress({
  status,
  timestamps,
  className,
}: {
  status: OrderStatus;
  timestamps?: Partial<Record<OrderStatus, string | null>>;
  className?: string;
}) {
  const current = stepIndex(status);
  return (
    <ol className={cn("grid gap-0 sm:grid-cols-4", className)} aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i < current || status === "completed";
        const active = i === current && status !== "completed";
        const ts = timestamps?.[step.status];
        return (
          <li
            key={step.status}
            className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:gap-3 sm:pb-0"
            aria-current={i === current ? "step" : undefined}
          >
            {/* connector */}
            {i < ORDER_STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-8 bottom-0 left-[0.95rem] w-px sm:top-[0.95rem] sm:right-0 sm:bottom-auto sm:left-8 sm:h-px sm:w-auto",
                  i < current ? "bg-ink" : "bg-line",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                done && "border-ink bg-ink text-ivory",
                active && "border-accent bg-accent-soft text-accent-strong ring-4 ring-accent/10",
                !done && !active && "border-field bg-paper text-muted",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <div className="min-w-0 sm:pr-4">
              <p className={cn("text-sm font-semibold", done || active ? "text-ink" : "text-muted")}>
                {step.label}
                <span className="sr-only">{done ? " — done" : active ? " — current stage" : " — upcoming"}</span>
              </p>
              {ts || active ? (
                <p className="mt-0.5 text-xs text-muted">{active && !done ? "Now" : `${formatDate(ts!, { year: undefined })}, ${formatTime(ts!)}`}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact 4-segment bar for cards and lists. */
export function OrderProgressBar({ status, className }: { status: OrderStatus; className?: string }) {
  const current = stepIndex(status);
  return (
    <div className={cn("flex gap-1", className)} role="img" aria-label={`Stage ${current + 1} of 4: ${ORDER_STEPS[current].label}`}>
      {ORDER_STEPS.map((s, i) => (
        <span
          key={s.status}
          className={cn(
            "h-1 flex-1 rounded-full",
            i < current || status === "completed" ? "bg-ink" : i === current ? "bg-accent" : "bg-line",
          )}
        />
      ))}
    </div>
  );
}
