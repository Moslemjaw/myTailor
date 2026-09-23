import Link from "next/link";
import { ArrowRight, Compass, UserRoundPen } from "lucide-react";
import { ActivityItem } from "@/components/activity/activity-item";
import { OrderCard } from "@/components/orders/order-card";
import { FeedRequestCard } from "@/components/requests/request-cards";
import { OfferStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatTile } from "@/components/ui/stat";
import type { Viewer } from "@/lib/auth";
import { firstName, formatDays, formatPrice, timeAgo } from "@/lib/format";
import { signImagePaths } from "@/lib/images";
import { getMyOffers, getNotifications, getOrders, getTailorFeed } from "@/lib/queries";
import { greeting } from "./greeting";

export async function TailorDashboard({ viewer, flags }: { viewer: Viewer; flags: { welcome: boolean; passwordUpdated: boolean } }) {
  const [feed, offers, orders, activity] = await Promise.all([
    getTailorFeed(),
    getMyOffers(viewer.id),
    getOrders(viewer.id, "tailor"),
    getNotifications(6),
  ]);

  const available = feed.filter((r) => !r.my_offer_status);
  const awaiting = offers.filter((o) => o.request?.status === "open" && (o.status === "pending" || o.status === "declined"));
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const completed = orders.filter((o) => o.status === "completed");
  const profileIncomplete = !viewer.profile.specialties.length || viewer.profile.years_experience == null;

  const images = await signImagePaths([...available.slice(0, 3).map((r) => r.image_path), ...orders.map((o) => o.request?.image_path)]);

  return (
    <div className="animate-fade-up">
      <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[1.05] text-ink md:text-5xl">
            {flags.welcome ? `Welcome, ${firstName(viewer.profile.full_name)}.` : `Hello, ${firstName(viewer.profile.full_name)}.`}
          </h1>
          <p className="mt-2 text-muted">Your opportunities and orders at a glance.</p>
        </div>
        <ButtonLink href="/browse" size="lg" icon={<Compass className="size-4" />}>
          Browse requests
        </ButtonLink>
      </header>

      {flags.passwordUpdated ? <Notice tone="success" className="mb-6" live>Your password has been updated.</Notice> : null}

      {profileIncomplete ? (
        <Notice
          tone="info"
          className="mb-8"
          title="Complete your tailor profile"
          action={
            <ButtonLink href="/profile" size="sm" variant="secondary" icon={<UserRoundPen className="size-4" />}>
              Add specialties & experience
            </ButtonLink>
          }
        >
          Customers see your specialties and experience next to every offer you send. It helps them choose you.
        </Notice>
      ) : null}

      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="New requests for you" value={available.length} href="/browse" highlight />
        <StatTile label="Offers awaiting decision" value={awaiting.length} href="/offers" />
        <StatTile label="Active orders" value={activeOrders.length} href="/orders" />
        <StatTile label="Completed orders" value={completed.length} href="/orders?tab=completed" />
      </div>

      <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          <section>
            <SectionHeader title="Active orders" description="Keep your customers updated as you work." action={<Link href="/orders" className="text-sm font-semibold text-ink hover:text-accent">All orders</Link>} />
            {activeOrders.length ? (
              <div className="grid gap-3">
                {activeOrders.map((o) => (
                  <OrderCard key={o.id} order={o} role="tailor" imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
                ))}
              </div>
            ) : (
              <EmptyState compact title="No active orders yet" description="When a customer chooses your offer, the order will appear here." />
            )}
          </section>

          <section>
            <SectionHeader
              title="New requests"
              description="Open requests you haven’t made an offer on."
              action={<Link href="/browse" className="text-sm font-semibold text-ink hover:text-accent">Browse all</Link>}
            />
            {available.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {available.slice(0, 3).map((r) => (
                  <FeedRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
                ))}
              </div>
            ) : (
              <EmptyState compact title="No requests are currently available." description="New customer requests appear here as soon as they’re posted." />
            )}
          </section>

          <section>
            <SectionHeader title="My active offers" description="Waiting for the customer to decide." action={<Link href="/offers" className="text-sm font-semibold text-ink hover:text-accent">All offers</Link>} />
            {awaiting.length ? (
              <Card className="divide-y divide-line">
                {awaiting.map((o) => (
                  <Link key={o.id} href={`/browse/${o.request_id}`} className="flex items-center gap-4 p-4 transition hover:bg-cream/40 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{o.request?.title}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatPrice(o.price)} · {formatDays(o.turnaround_days)} · updated {timeAgo(o.updated_at)}
                      </p>
                    </div>
                    <OfferStatusBadge status={o.status} />
                    <ArrowRight className="hidden size-4 text-stone sm:block" aria-hidden />
                  </Link>
                ))}
              </Card>
            ) : (
              <EmptyState compact title="No offers waiting" description="Offers you send on open requests will appear here." />
            )}
          </section>
        </div>

        <aside>
          <SectionHeader title="Recent activity" action={<Link href="/activity" className="text-sm font-semibold text-ink hover:text-accent">See all</Link>} />
          <Card className="px-3 py-1">
            {activity.length ? (
              <div className="divide-y divide-line">
                {activity.map((n) => (
                  <ActivityItem key={n.id} n={n} compact />
                ))}
              </div>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted">Nothing yet. Updates about your offers and orders will appear here.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
