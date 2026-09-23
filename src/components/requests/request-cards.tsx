import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Users } from "lucide-react";
import { Badge, OfferStatusBadge, RequestStatusBadge } from "@/components/ui/badge";
import { garmentLabel } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { describeDeadline, orderRef, plural, timeAgo } from "@/lib/format";
import type { CustomerRequestRow } from "@/lib/queries";
import type { FeedRequest } from "@/lib/types";
import { RequestImage } from "./request-image";

/** Customer's own request — what's happening with it at a glance. */
export function CustomerRequestCard({ request, imageUrl }: { request: CustomerRequestRow; imageUrl?: string | null }) {
  const total = request.offers.length;
  const pending = request.offers.filter((o) => o.status === "pending").length;

  let summary: React.ReactNode;
  if (request.order) {
    summary = <span className="text-ink">Order {orderRef(request.order.order_number)} created</span>;
  } else if (request.status === "closed") {
    summary = "Closed";
  } else if (pending > 0) {
    summary = <span className="font-semibold text-accent">{plural(pending, "offer")} waiting for you</span>;
  } else if (total > 0) {
    summary = `${plural(total, "offer")} reviewed`;
  } else {
    summary = "Waiting for offers";
  }

  return (
    <Link
      href={request.order ? `/orders/${request.order.id}` : `/requests/${request.id}`}
      className="group flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft transition hover:border-stone hover:shadow-lift sm:p-5"
    >
      <RequestImage url={imageUrl} alt="" className="size-20 shrink-0 rounded-xl sm:size-24" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={request.status} />
          {pending > 0 && request.status === "open" ? <Badge tone="accent">New offers</Badge> : null}
        </div>
        <p className="mt-2 truncate font-semibold text-ink">{request.title}</p>
        <p className="mt-0.5 text-sm text-muted">
          {garmentLabel(request.garment_type)} · needed {describeDeadline(request.desired_date).toLowerCase()}
        </p>
        <p className="mt-auto pt-2 text-sm text-muted">{summary}</p>
      </div>
      <ChevronRight className="hidden size-5 self-center text-stone transition group-hover:translate-x-0.5 group-hover:text-ink sm:block" aria-hidden />
    </Link>
  );
}

/** Marketplace card for tailors — aggregate competition only. */
export function FeedRequestCard({ request, imageUrl }: { request: FeedRequest; imageUrl?: string | null }) {
  return (
    <Link
      href={`/browse/${request.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-soft transition hover:-translate-y-0.5 hover:border-stone hover:shadow-lift"
    >
      <RequestImage url={imageUrl} alt={`Reference image for ${request.title}`} className="aspect-[4/3] w-full" iconClassName="size-8" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-accent uppercase">{garmentLabel(request.garment_type)}</span>
          <span className="text-xs text-muted">{timeAgo(request.created_at)}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-[1.05rem] leading-snug font-semibold text-ink">{request.title}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{request.description}</p>
        <div className="mt-auto space-y-2 pt-5 text-[0.82rem] text-muted">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-stone" aria-hidden /> Needed {describeDeadline(request.desired_date).toLowerCase()}
          </p>
          {request.customer_city ? (
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-stone" aria-hidden /> {request.customer_city}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <CompetitionLabel count={request.offer_count} />
          {request.my_offer_status ? (
            <OfferStatusBadge status={request.my_offer_status} />
          ) : (
            <span className="text-sm font-semibold text-ink group-hover:text-accent">View request</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** The only competition signal tailors receive: a count. */
export function CompetitionLabel({ count, className }: { count: number; className?: string }) {
  const label = count === 0 ? "No offers yet — be the first" : count < 3 ? plural(count, "offer") : `${count} offers — popular`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.82rem] text-muted", className)}>
      <Users className="size-4 text-stone" aria-hidden />
      {label}
    </span>
  );
}
