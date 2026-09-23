import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, Compass } from "lucide-react";
import { OfferStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, RowList } from "@/components/ui/card";
import { GarmentThumb } from "@/components/ui/garment-icon";
import { EmptyState } from "@/components/ui/feedback";
import { LinkTabs } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { formatDays, formatPrice, orderRef, timeAgo } from "@/lib/format";
import { signImagePaths } from "@/lib/images";
import { getMyOffers, type MyOfferRow } from "@/lib/queries";

export const metadata: Metadata = { title: "My offers" };

export default async function MyOffersPage({ searchParams }: PageProps<"/offers">) {
  const viewer = await requireRole("tailor");
  const sp = await searchParams;
  const tab = sp.tab === "accepted" || sp.tab === "closed" ? sp.tab : "active";

  const offers = await getMyOffers(viewer.id);
  const active = offers.filter((o) => o.request?.status === "open" && (o.status === "pending" || o.status === "declined"));
  const accepted = offers.filter((o) => o.status === "accepted");
  const closed = offers.filter((o) => o.status === "closed" || (o.request?.status === "closed" && o.status !== "accepted"));
  const shown = tab === "active" ? active : tab === "accepted" ? accepted : closed;
  const images = await signImagePaths(shown.map((o) => o.request?.image_path));

  return (
    <>
      <PageHeader
        title="My offers"
        actions={<ButtonLink href="/browse" variant="secondary" icon={<Compass className="size-4" />}>Browse requests</ButtonLink>}
      />

      {offers.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="You haven’t made any offers yet"
          description="Find an open request that suits your skills and send your price and timing."
          action={<ButtonLink href="/browse" icon={<Compass className="size-4" />}>Browse requests</ButtonLink>}
        />
      ) : (
        <>
          <LinkTabs
            label="Filter offers"
            active={tab}
            tabs={[
              { key: "active", label: "Awaiting decision", href: "/offers", count: active.length },
              { key: "accepted", label: "Accepted", href: "/offers?tab=accepted", count: accepted.length },
              { key: "closed", label: "Closed", href: "/offers?tab=closed", count: closed.length },
            ]}
          />
          {shown.length ? (
            <RowList>
              {shown.map((o) => (
                <li key={o.id}>
                  <OfferRow offer={o} imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
                </li>
              ))}
            </RowList>
          ) : (
            <EmptyState
              compact
              title={tab === "active" ? "No offers awaiting a decision" : tab === "accepted" ? "No accepted offers yet" : "No closed offers"}
              description={
                tab === "accepted"
                  ? "When a customer chooses you, the offer appears here with a link to the order."
                  : tab === "closed"
                    ? "Offers close when a customer chooses another tailor."
                    : "Send an offer on an open request to see it here."
              }
            />
          )}
        </>
      )}
    </>
  );
}

function OfferRow({ offer, imageUrl }: { offer: MyOfferRow; imageUrl?: string | null }) {
  const href = offer.order ? `/orders/${offer.order.id}` : `/browse/${offer.request_id}`;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ivory sm:px-5"
    >
      <GarmentThumb type={offer.request?.garment_type ?? ""} imageUrl={imageUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{offer.request?.title ?? "Request"}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {formatPrice(offer.price)} · {formatDays(offer.turnaround_days)}
          {offer.revision > 1 ? ` · revision ${offer.revision}` : ""}
          <span className="hidden sm:inline">
            {" · "}
            {offer.order
              ? `Order ${orderRef(offer.order.order_number)}`
              : offer.status === "declined" && offer.request?.status === "open"
                ? "You can revise it"
                : `updated ${timeAgo(offer.updated_at)}`}
          </span>
        </p>
      </div>
      <OfferStatusBadge status={offer.status} />
      <ChevronRight className="size-4 shrink-0 text-stone transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
    </Link>
  );
}
