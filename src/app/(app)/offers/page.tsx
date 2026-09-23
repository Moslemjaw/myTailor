import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, Compass } from "lucide-react";
import { RequestImage } from "@/components/requests/request-image";
import { Badge, OfferStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { LinkTabs } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { garmentLabel } from "@/lib/constants";
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
        eyebrow="Tailor"
        title="My offers"
        description="Every offer you’ve made, and where it stands with the customer."
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
            <ul className="grid gap-3">
              {shown.map((o) => (
                <li key={o.id}>
                  <OfferRow offer={o} imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
                </li>
              ))}
            </ul>
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
      className="group flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft transition hover:border-stone hover:shadow-lift sm:p-5"
    >
      <RequestImage url={imageUrl} alt="" className="size-16 shrink-0 rounded-xl sm:size-20" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <OfferStatusBadge status={offer.status} />
          {offer.revision > 1 ? <Badge>Revision {offer.revision}</Badge> : null}
        </div>
        <p className="mt-1.5 truncate font-semibold text-ink">{offer.request?.title ?? "Request"}</p>
        <p className="mt-0.5 text-sm text-muted">
          {garmentLabel(offer.request?.garment_type ?? "")} · {formatPrice(offer.price)} · {formatDays(offer.turnaround_days)}
        </p>
        <p className="mt-2 text-xs text-muted">
          {offer.order
            ? `Order ${orderRef(offer.order.order_number)} — open order`
            : offer.status === "declined" && offer.request?.status === "open"
              ? "Declined — you can revise it"
              : `Updated ${timeAgo(offer.updated_at)}`}
        </p>
      </div>
      <ChevronRight className="hidden size-5 self-center text-stone transition group-hover:translate-x-0.5 group-hover:text-ink sm:block" aria-hidden />
    </Link>
  );
}
