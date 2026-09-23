import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-sand bg-paper/60 text-center",
        compact ? "px-6 py-8" : "px-6 py-14 md:py-16",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-cream text-muted [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className={cn("font-semibold text-ink", compact ? "text-[0.95rem]" : "text-lg")}>{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

type NoticeTone = "info" | "success" | "warning" | "danger" | "locked";

const noticeStyles: Record<NoticeTone, { cls: string; icon: ReactNode }> = {
  info: { cls: "bg-info-soft/70 text-info border-info/15", icon: <Info aria-hidden /> },
  success: { cls: "bg-success-soft text-success border-success/15", icon: <CircleCheck aria-hidden /> },
  warning: { cls: "bg-warning-soft text-warning border-warning/20", icon: <CircleAlert aria-hidden /> },
  danger: { cls: "bg-danger-soft text-danger border-danger/15", icon: <CircleAlert aria-hidden /> },
  locked: { cls: "bg-cream text-muted border-line", icon: <Lock aria-hidden /> },
};

export function Notice({
  tone = "info",
  title,
  children,
  action,
  className,
  live,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  live?: boolean;
}) {
  const s = noticeStyles[tone];
  return (
    <div
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
      className={cn("flex gap-3 rounded-2xl border p-4 text-sm", s.cls, className)}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-[1.1rem]">{s.icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn("leading-relaxed text-ink/80", title && "mt-1")}>{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}
