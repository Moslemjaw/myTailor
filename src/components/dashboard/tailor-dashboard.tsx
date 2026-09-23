import Link from "next/link";
import { ChevronRight, Compass } from "lucide-react";
import { OrderCard } from "@/components/orders/order-card";
import { FeedRequestCard } from "@/components/requests/request-cards";
import { OfferStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, RowList, SectionHeader, SectionLink } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import type { Viewer } from "@/lib/auth";
import { firstName, formatDays, formatPrice, plural } from "@/lib/format";
import { signImagePaths } from "@/lib/images";
import { getMyOffers, getOrders, getTailorFeed } from "@/lib/queries";

export async function TailorDashboard({ viewer, flags }: { viewer: Viewer; flags: { welcome: boolean; passwordUpdated: boolean } }) {
  const [feed, offers, orders] = await Promise.all([getTailorFeed(), getMyOffers(viewer.id), getOrders(viewer.id, "tailor")]);

  const fresh = feed.filter((r) => !r.my_offer_status);
  const awaiting = offers.filter((o) => o.request?.status === "open" && (o.status === "pending" || o.status === "declined"));
  const active = orders.filter((o) => o.status !== "completed");
  const profileIncomplete = !viewer.profile.specialties.length || viewer.profile.years_experience == null;

  const images = await signImagePaths([...fresh.slice(0, 4).map((r) => r.image_path), ...active.map((o) => o.request?.image_path)]);
  const summary = [
    active.length ? plural(active.length, "active order") : null,
    fresh.length ? plural(fresh.length, "new request") : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={`Hello, ${firstName(viewer.profile.full_name)}`}
        description={summary.length ? `${summary.join(" · ")}.` : "You’re all caught up."}
        actions={<ButtonLink href="/browse" icon={<Compass className="size-4" />}>Browse requests</ButtonLink>}
      />

      {flags.passwordUpdated ? <Notice tone="success" className="mb-8" live>Your password has been updated.</Notice> : null}
      {profileIncomplete ? (
        <Link
          href="/profile"
          className="mb-8 flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-line px-5 py-4 text-sm transition hover:bg-paper"
        >
          <span>
            <span className="font-medium text-ink">Complete your profile.</span>{" "}
            <span className="text-muted">Specialties and experience appear next to your offers.</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-stone" aria-hidden />
        </Link>
      ) : null}

      <div className="space-y-10">
        <section>
          <SectionHeader title="Active orders" action={active.length ? <SectionLink href="/orders">View all</SectionLink> : null} />
          {active.length ? (
            <RowList>
              {active.map((o) => (
                <OrderCard key={o.id} order={o} role="tailor" imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
              ))}
            </RowList>
          ) : (
            <p className="rounded-[var(--radius-card)] border border-line px-5 py-6 text-sm text-muted">
              When a customer accepts your offer, the order appears here.
            </p>
          )}
        </section>

        <section>
          <SectionHeader title="New requests" action={<SectionLink href="/browse">View all</SectionLink>} />
          {fresh.length ? (
            <RowList>
              {fresh.slice(0, 4).map((r) => (
                <FeedRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
              ))}
            </RowList>
          ) : (
            <EmptyState compact icon={<Compass />} title="No requests are currently available." description="New requests appear here as soon as they’re posted." />
          )}
        </section>

        {awaiting.length ? (
          <section>
            <SectionHeader title="Awaiting decision" action={<SectionLink href="/offers">All offers</SectionLink>} />
            <RowList>
              {awaiting.map((o) => (
                <li key={o.id}>
                  <Link href={`/browse/${o.request_id}`} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ivory sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{o.request?.title}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatPrice(o.price)} · {formatDays(o.turnaround_days)}
                      </p>
                    </div>
                    <OfferStatusBadge status={o.status} />
                    <ChevronRight className="size-4 shrink-0 text-stone" aria-hidden />
                  </Link>
                </li>
              ))}
            </RowList>
          </section>
        ) : null}
      </div>
    </>
  );
}
