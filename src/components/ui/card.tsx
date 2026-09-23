import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-paper", className)} {...props} />;
}

export function SectionHeader({
  title,
  description,
  action,
  as: Tag = "h2",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <Tag className="text-[0.95rem] font-semibold text-ink">{title}</Tag>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** One bordered surface with hairline-separated rows — calmer than stacked cards. */
export function RowList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ul aria-label={label} className={cn("divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper", className)}>
      {children}
    </ul>
  );
}

/** Link-style "View all" used beside section titles. */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-sm font-medium text-muted transition hover:text-ink">
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-8 md:mb-10">
      {back ? <div className="mb-6">{back}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1.5 text-sm text-muted">{eyebrow}</p> : null}
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-[0.95rem] text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Label/value pair used in detail summaries. */
export function Detail({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[0.8rem] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[0.95rem] font-medium text-ink">{children}</dd>
    </div>
  );
}
