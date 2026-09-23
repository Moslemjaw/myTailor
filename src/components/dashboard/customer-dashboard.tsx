import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus, Sparkles, Star } from "lucide-react";
import { ActivityItem } from "@/components/activity/activity-item";
import { OrderCard } from "@/components/orders/order-card";
import { CustomerRequestCard } from "@/components/requests/request-cards";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatTile } from "@/components/ui/stat";
import type { Viewer } from "@/lib/auth";
import { BRAND_IMAGES } from "@/lib/brand-images";
import { firstName, orderRef, plural } from "@/lib/format";
import { signImagePaths } from "@/lib/images";
import { getCustomerRequests, getNotifications, getOrders } from "@/lib/queries";
import { greeting } from "./greeting";

export async function CustomerDashboard({ viewer, flags }: { viewer: Viewer; flags: { welcome: boolean; passwordUpdated: boolean } }) {
  const [requests, orders, activity] = await Promise.all([
    getCustomerRequests(viewer.id),
    getOrders(viewer.id, "customer"),
    getNotifications(6),
  ]);

  const openRequests = requests.filter((r) => r.status === "open");
  const withNewOffers = openRequests.filter((r) => r.offers.some((o) => o.status === "pending"));
  const waiting = openRequests.filter((r) => !r.offers.some((o) => o.status === "pending"));
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const completed = orders.filter((o) => o.status === "completed");
  const toReview = completed.filter((o) => !o.review);
  const ready = activeOrders.filter((o) => o.status === "ready");
  const pendingOffers = withNewOffers.reduce((n, r) => n + r.offers.filter((o) => o.status === "pending").length, 0);

  const images = await signImagePaths([...openRequests.map((r) => r.image_path), ...orders.map((o) => o.request?.image_path)]);
  const isNew = requests.length === 0 && orders.length === 0;

  return (
    <div className="animate-fade-up">
      <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1 className="mt-3 font-display text-[2.6rem] leading-[1.05] text-ink md:text-5xl">
            {isNew ? `Welcome, ${firstName(viewer.profile.full_name)}.` : `Hello, ${firstName(viewer.profile.full_name)}.`}
          </h1>
          <p className="mt-2 text-muted">
            {isNew ? "Let’s get your first garment made." : "Here’s what’s happening with your requests and orders."}
          </p>
        </div>
        <ButtonLink href="/requests/new" size="lg" icon={<Plus className="size-4" />}>
          Create request
        </ButtonLink>
      </header>

      {flags.passwordUpdated ? <Notice tone="success" className="mb-6" live>Your password has been updated.</Notice> : null}

      {isNew ? (
        <FirstRequestHero />
      ) : (
        <>
          {/* Attention */}
          {withNewOffers.length || ready.length || toReview.length ? (
            <section aria-labelledby="attention" className="mb-10">
              <h2 id="attention" className="sr-only">Needs your attention</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {withNewOffers.map((r) => (
                  <AttentionCard
                    key={r.id}
                    href={`/requests/${r.id}`}
                    label="Compare offers"
                    title={r.title}
                    text={`${plural(r.offers.filter((o) => o.status === "pending").length, "offer")} waiting for your decision`}
                  />
                ))}
                {ready.map((o) => (
                  <AttentionCard
                    key={o.id}
                    href={`/orders/${o.id}`}
                    label="Ready for you"
                    title={o.request?.title ?? `Order ${orderRef(o.order_number)}`}
                    text={`${o.tailor?.full_name ?? "Your tailor"} has marked it as ready`}
                  />
                ))}
                {toReview.map((o) => (
                  <AttentionCard
                    key={o.id}
                    href={`/orders/${o.id}/review`}
                    label="Leave a review"
                    title={o.request?.title ?? `Order ${orderRef(o.order_number)}`}
                    text={`How was working with ${o.tailor?.full_name ?? "your tailor"}?`}
                    icon={<Star className="size-4" />}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Open requests" value={openRequests.length} href="/requests" />
            <StatTile label="Offers to review" value={pendingOffers} href="/requests" highlight />
            <StatTile label="Active orders" value={activeOrders.length} href="/orders" />
            <StatTile label="Completed" value={completed.length} href="/orders?tab=completed" />
          </div>

          <div className="grid gap-10 xl:grid-cols-[1fr_20rem]">
            <div className="space-y-10">
              <section>
                <SectionHeader
                  title="Requests with new offers"
                  description="Tailors have responded — compare and choose."
                  action={<Link href="/requests" className="text-sm font-semibold text-ink hover:text-accent">All requests</Link>}
                />
                {withNewOffers.length ? (
                  <div className="grid gap-3">
                    {withNewOffers.map((r) => (
                      <CustomerRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact title="No new offers right now" description="We’ll let you know as soon as a tailor responds." />
                )}
              </section>

              <section>
                <SectionHeader title="Waiting for offers" description="Open requests tailors can still respond to." />
                {waiting.length ? (
                  <div className="grid gap-3">
                    {waiting.map((r) => (
                      <CustomerRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    compact
                    title="No requests waiting"
                    description="Need something else made? Post a new request."
                    action={<ButtonLink href="/requests/new" variant="secondary" size="sm">Create request</ButtonLink>}
                  />
                )}
              </section>

              <section>
                <SectionHeader
                  title="Active orders"
                  action={<Link href="/orders" className="text-sm font-semibold text-ink hover:text-accent">All orders</Link>}
                />
                {activeOrders.length ? (
                  <div className="grid gap-3">
                    {activeOrders.map((o) => (
                      <OrderCard key={o.id} order={o} role="customer" imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
                    ))}
                  </div>
                ) : (
                  <EmptyState compact title="No active orders" description="When you choose a tailor, your order will appear here." />
                )}
              </section>

              {completed.length ? (
                <section>
                  <SectionHeader title="Completed orders" />
                  <div className="grid gap-3">
                    {completed.slice(0, 3).map((o) => (
                      <OrderCard key={o.id} order={o} role="customer" imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside>
              <SectionHeader
                title="Recent activity"
                action={<Link href="/activity" className="text-sm font-semibold text-ink hover:text-accent">See all</Link>}
              />
              <Card className="px-3 py-1">
                {activity.length ? (
                  <div className="divide-y divide-line">
                    {activity.map((n) => (
                      <ActivityItem key={n.id} n={n} compact />
                    ))}
                  </div>
                ) : (
                  <p className="px-2 py-6 text-center text-sm text-muted">Nothing yet. Updates about offers and orders will appear here.</p>
                )}
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function AttentionCard({
  href,
  label,
  title,
  text,
  icon,
}: {
  href: string;
  label: string;
  title: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href} className="group flex flex-col rounded-2xl bg-ink p-5 text-ivory transition hover:bg-charcoal">
      <span className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-accent-soft uppercase">
        {icon}
        {label}
      </span>
      <span className="mt-3 truncate font-semibold">{title}</span>
      <span className="mt-1 text-sm text-ivory/65">{text}</span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
        Open <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function FirstRequestHero() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-line bg-paper shadow-soft">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="p-7 md:p-12">
          <p className="eyebrow">Your first request</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">You haven’t created any requests yet.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Tell tailors what you’d like made. Add a photo for inspiration and our assistant can help you describe it.
          </p>
          <ol className="mt-8 space-y-4">
            {[
              "Describe the garment and add a reference photo",
              "Receive offers with price and timing",
              "Choose a tailor and chat privately",
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-4 text-sm text-ink">
                <span className="flex size-7 items-center justify-center rounded-full border border-line font-semibold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/requests/new" size="lg" icon={<Plus className="size-4" />}>
              Create your first request
            </ButtonLink>
            <span className="inline-flex items-center gap-2 px-2 text-sm text-muted">
              <Sparkles className="size-4 text-accent" aria-hidden /> AI description help included
            </span>
          </div>
        </div>
        <div className="relative min-h-64">
          <Image src={BRAND_IMAGES.satinAndTape.src} alt={BRAND_IMAGES.satinAndTape.alt} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
