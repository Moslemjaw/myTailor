import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/constants";
import { OFFER_STATUS, ORDER_STATUS, REQUEST_STATUS } from "@/lib/constants";
import type { OfferStatus, OrderStatus, RequestStatus } from "@/lib/types";

const tones: Record<Tone, string> = {
  neutral: "bg-cream text-muted ring-line",
  accent: "bg-accent-soft text-accent-strong ring-accent/15",
  success: "bg-success-soft text-success ring-success/15",
  warning: "bg-warning-soft text-warning ring-warning/15",
  danger: "bg-danger-soft text-danger ring-danger/15",
  info: "bg-info-soft text-info ring-info/15",
};

export function Badge({
  tone = "neutral",
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const s = REQUEST_STATUS[status];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const s = OFFER_STATUS[status];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}
