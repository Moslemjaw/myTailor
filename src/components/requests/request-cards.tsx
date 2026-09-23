import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Badge, OfferStatusBadge } from "@/components/ui/badge";
import { GarmentThumb } from "@/components/ui/garment-icon";
import { garmentLabel } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { formatDateShort, orderRef, plural, timeAgo } from "@/lib/format";
import type { CustomerRequestRow } from "@/lib/queries";
import type { FeedRequest } from "@/lib/types";

const row = "group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ivory sm:px-5";

/** Customer's own request — one line of status, one obvious signal. */
export function CustomerRequestCard({ request, imageUrl }: { request: CustomerRequestRow; imageUrl?: string | null }) {
  const pending = request.offers.filter((o) => o.status === "pending").length;
  const total = request.offers.length;

  let status: React.ReactNode;
  if (request.order) status = <Badge tone="success">Order {orderRef(request.order.order_number)}</Badge>;
  else if (request.status === "closed") status = <Badge>Closed</Badge>;
  else if (pending > 0) status = <Badge tone="accent" dot>{plural(pending, "new offer")}</Badge>;
  else status = <span className="text-sm text-muted">{total ? plural(total, "offer") : "Awaiting offers"}</span>;

  return (
    <li>
      <Link href={request.order ? `/orders/${request.order.id}` : `/requests/${request.id}`} className={row}>
        <GarmentThumb type={request.garment_type} imageUrl={imageUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{request.title}</p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {garmentLabel(request.garment_type)} · by {formatDateShort(request.desired_date)}
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">{status}</div>
        <ChevronRight className="size-4 shrink-0 text-stone transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
      </Link>
      <div className="-mt-2 pb-3 pl-[4.75rem] sm:hidden">{status}</div>
    </li>
  );
}

/** Marketplace row for tailors — aggregate competition only, never offer contents. */
export function FeedRequestCard({ request, imageUrl }: { request: FeedRequest; imageUrl?: string | null }) {
  return (
    <li>
      <Link href={`/browse/${request.id}`} className={cn(row, "items-start sm:items-center")}>
        <GarmentThumb type={request.garment_type} imageUrl={imageUrl} size="lg" alt="" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{request.title}</p>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted">{request.description}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-muted">
            <span>{garmentLabel(request.garment_type)}</span>
            <span aria-hidden>·</span>
            <span>Needed {formatDateShort(request.desired_date)}</span>
            <span aria-hidden>·</span>
            <CompetitionLabel count={request.offer_count} />
            <span className="hidden sm:inline" aria-hidden>·</span>
            <span className="hidden sm:inline">{timeAgo(request.created_at)}</span>
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          {request.my_offer_status ? <OfferStatusBadge status={request.my_offer_status} /> : null}
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-stone transition group-hover:translate-x-0.5 group-hover:text-ink sm:mt-0" aria-hidden />
      </Link>
    </li>
  );
}

/** The only competition signal tailors receive: a count. */
export function CompetitionLabel({ count, className }: { count: number; className?: string }) {
  const label = count === 0 ? "No offers yet" : count === 1 ? "1 offer" : `${count} offers`;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Users className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
