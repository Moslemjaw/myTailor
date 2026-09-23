import Link from "next/link";
import { FilePlus2, MessageSquare, PackageCheck, Plus, Sparkles, Star, Tag } from "lucide-react";
import { OrderCard } from "@/components/orders/order-card";
import { CustomerRequestCard } from "@/components/requests/request-cards";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, RowList, SectionHeader, SectionLink } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import type { Viewer } from "@/lib/auth";
import { firstName, orderRef, plural } from "@/lib/format";
import { signImagePaths } from "@/lib/images";
import { getCustomerRequests, getOrders } from "@/lib/queries";
import { AttentionRow } from "./attention-row";

export async function CustomerDashboard({ viewer, flags }: { viewer: Viewer; flags: { welcome: boolean; passwordUpdated: boolean } }) {
  const [requests, orders] = await Promise.all([getCustomerRequests(viewer.id), getOrders(viewer.id, "customer")]);

  const open = requests.filter((r) => r.status === "open");
  const withOffers = open.filter((r) => r.offers.some((o) => o.status === "pending"));
  const waiting = open.filter((r) => !withOffers.includes(r));
  const active = orders.filter((o) => o.status !== "completed");
  const ready = active.filter((o) => o.status === "ready");
  const toReview = orders.filter((o) => o.status === "completed" && !o.review);
  const recentOrders = [...active, ...orders.filter((o) => o.status === "completed")].slice(0, 5);

  const images = await signImagePaths([...open.map((r) => r.image_path), ...recentOrders.map((o) => o.request?.image_path)]);
  const isNew = requests.length === 0 && orders.length === 0;
  const name = firstName(viewer.profile.full_name);

  if (isNew) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center md:py-20">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cream text-charcoal">
          <FilePlus2 className="size-6" strokeWidth={1.5} aria-hidden />
        </span>
        <h1 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Welcome, {name}</h1>
        <p className="mt-2 text-muted">Describe what you’d like made and tailors will send you offers.</p>
        <ButtonLink href="/requests/new" size="lg" className="mt-8" icon={<Plus className="size-4" />}>
          Create your first request
        </ButtonLink>
        <ol className="mt-14 grid gap-6 text-left sm:grid-cols-3">
          {[
            [<Sparkles key="s" />, "Describe it", "Add a photo — AI can help with the words."],
            [<Tag key="t" />, "Compare offers", "Price, timing and reviews side by side."],
            [<MessageSquare key="m" />, "Work together", "Private chat until it’s finished."],
          ].map(([icon, title, text]) => (
            <li key={title as string}>
              <span className="text-accent [&_svg]:size-5 [&_svg]:stroke-[1.5]">{icon}</span>
              <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const attention = withOffers.length + ready.length + toReview.length;

  return (
    <>
      <PageHeader
        title={`Hello, ${name}`}
        description={attention ? `${plural(attention, "thing")} need${attention === 1 ? "s" : ""} your attention.` : "You’re all caught up."}
        actions={<ButtonLink href="/requests/new" icon={<Plus className="size-4" />}>New request</ButtonLink>}
      />

      {flags.passwordUpdated ? <Notice tone="success" className="mb-8" live>Your password has been updated.</Notice> : null}

      <div className="space-y-10">
        {attention ? (
          <section>
            <SectionHeader title="Needs your attention" />
            <RowList>
              {withOffers.map((r) => {
                const n = r.offers.filter((o) => o.status === "pending").length;
                return <AttentionRow key={r.id} href={`/requests/${r.id}`} icon={<Tag />} title={r.title} detail={`${plural(n, "offer")} to compare`} action="Compare" />;
              })}
              {ready.map((o) => (
                <AttentionRow key={o.id} href={`/orders/${o.id}`} icon={<PackageCheck />} title={o.request?.title ?? `Order ${orderRef(o.order_number)}`} detail={`Ready — arrange collection with ${o.tailor?.full_name ?? "your tailor"}`} action="View" />
              ))}
              {toReview.map((o) => (
                <AttentionRow key={o.id} href={`/orders/${o.id}/review`} icon={<Star />} title={o.request?.title ?? `Order ${orderRef(o.order_number)}`} detail={`How was ${o.tailor?.full_name ?? "your tailor"}?`} action="Review" />
              ))}
            </RowList>
          </section>
        ) : null}

        <section>
          <SectionHeader title={withOffers.length ? "Waiting for offers" : "Open requests"} action={<SectionLink href="/requests">View all</SectionLink>} />
          {waiting.length ? (
            <RowList>
              {waiting.slice(0, 5).map((r) => (
                <CustomerRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
              ))}
            </RowList>
          ) : (
            <p className="rounded-[var(--radius-card)] border border-line px-5 py-6 text-sm text-muted">
              {open.length ? "Every open request has offers to compare above." : "No open requests."} <Link href="/requests/new" className="font-medium text-ink underline underline-offset-4">Create one</Link>
            </p>
          )}
        </section>

        {recentOrders.length ? (
          <section>
            <SectionHeader title="Orders" action={<SectionLink href="/orders">View all</SectionLink>} />
            <RowList>
              {recentOrders.map((o) => (
                <OrderCard key={o.id} order={o} role="customer" imageUrl={o.request?.image_path ? images.get(o.request.image_path) : null} />
              ))}
            </RowList>
          </section>
        ) : null}
      </div>
    </>
  );
}
