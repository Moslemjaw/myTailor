import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/badge";
import { RequestImage } from "@/components/requests/request-image";
import { garmentLabel } from "@/lib/constants";
import { formatPrice, formatDays, orderRef, timeAgo } from "@/lib/format";
import type { OrderRow } from "@/lib/queries";
import type { Role } from "@/lib/types";
import { OrderProgressBar } from "./order-progress";

export function OrderCard({ order, role, imageUrl }: { order: OrderRow; role: Role; imageUrl?: string | null }) {
  const counterpart = role === "customer" ? order.tailor : order.customer;
  const needsReview = role === "customer" && order.status === "completed" && !order.review;
  const tailorAction =
    role === "tailor"
      ? { accepted: "Start work", in_progress: "Mark as ready", ready: "Mark as completed", completed: null }[order.status]
      : null;

  return (
    <Link
      href={`/orders/${order.id}`}
      className="group flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft transition hover:border-stone hover:shadow-lift sm:p-5"
    >
      <RequestImage url={imageUrl} alt="" className="size-20 shrink-0 rounded-xl sm:size-24" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted">Order {orderRef(order.order_number)}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1.5 truncate font-semibold text-ink">{order.request?.title ?? garmentLabel("")}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {role === "customer" ? "Made by " : "For "}
          <span className="text-ink/80">{counterpart?.full_name ?? "—"}</span> · {formatPrice(order.price)} ·{" "}
          {formatDays(order.turnaround_days)}
        </p>
        <div className="mt-auto flex items-center gap-4 pt-3">
          <OrderProgressBar status={order.status} className="max-w-40 flex-1" />
          {needsReview ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <Star className="size-3.5" aria-hidden /> Leave a review
            </span>
          ) : tailorAction ? (
            <span className="text-xs font-semibold text-accent">Next: {tailorAction}</span>
          ) : (
            <span className="text-xs text-muted">{timeAgo(order.created_at)}</span>
          )}
        </div>
      </div>
      <ChevronRight className="hidden size-5 self-center text-stone transition group-hover:translate-x-0.5 group-hover:text-ink sm:block" aria-hidden />
    </Link>
  );
}
