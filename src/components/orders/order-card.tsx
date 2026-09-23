import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { GarmentThumb } from "@/components/ui/garment-icon";
import { formatPrice, orderRef } from "@/lib/format";
import type { OrderRow } from "@/lib/queries";
import type { Role } from "@/lib/types";
import { OrderProgressBar } from "./order-progress";

const NEXT: Record<string, string | null> = {
  accepted: "Start work",
  in_progress: "Mark as ready",
  ready: "Mark as completed",
  completed: null,
};

export function OrderCard({ order, role, imageUrl }: { order: OrderRow; role: Role; imageUrl?: string | null }) {
  const counterpart = role === "customer" ? order.tailor : order.customer;
  const needsReview = role === "customer" && order.status === "completed" && !order.review;
  const nextStep = role === "tailor" ? NEXT[order.status] : null;

  return (
    <li>
      <Link
        href={needsReview ? `/orders/${order.id}/review` : `/orders/${order.id}`}
        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ivory sm:px-5"
      >
        <GarmentThumb type={order.request?.garment_type ?? ""} imageUrl={imageUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{order.request?.title ?? `Order ${orderRef(order.order_number)}`}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {counterpart?.full_name ?? "—"} · {formatPrice(order.price)}
          </p>
          <OrderProgressBar status={order.status} className="mt-2.5 max-w-36" />
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          {needsReview ? <Badge tone="accent" dot>Review</Badge> : <OrderStatusBadge status={order.status} />}
          {nextStep ? <span className="text-xs text-muted">Next: {nextStep}</span> : null}
        </div>
        <ChevronRight className="size-4 shrink-0 text-stone transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </Link>
    </li>
  );
}
