import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessageSquare, Pencil, Sparkles } from "lucide-react";
import { OfferBoard } from "@/components/offers/offer-board";
import { RequestImage } from "@/components/requests/request-image";
import { RequestStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Detail, SectionHeader } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { garmentLabel } from "@/lib/constants";
import { describeDeadline, formatDate, orderRef, plural } from "@/lib/format";
import { signImagePath } from "@/lib/images";
import { getCustomerRequestDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Request" };

export default async function RequestDetailPage({ params, searchParams }: PageProps<"/requests/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await requireRole("customer");
  const detail = await getCustomerRequestDetail(id, viewer.id);
  // Not the owner, or doesn't exist — same response, nothing leaked.
  if (!detail) notFound();

  const { request, offers, stats, order } = detail;
  const imageUrl = await signImagePath(request.image_path);
  const pending = offers.filter((o) => o.status === "pending").length;
  const chosen = offers.find((o) => o.status === "accepted");

  return (
    <>
      <div className="mb-6">
        <BackLink href="/requests">My requests</BackLink>
      </div>

      <header className="mb-8 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={request.status} />
          <span className="text-sm text-muted">
            {garmentLabel(request.garment_type)} · posted {formatDate(request.created_at, { year: undefined })}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="font-display text-[2.4rem] leading-[1.05] text-ink md:text-5xl">{request.title}</h1>
          {request.status === "open" ? (
            <ButtonLink href={`/requests/${id}/edit`} variant="secondary" size="sm" icon={<Pencil className="size-4" />}>
              Edit request
            </ButtonLink>
          ) : null}
        </div>
      </header>

      {sp.created === "1" ? (
        <Notice tone="success" className="mb-6" title="Your request is live" live>
          Tailors can now see it and send offers. We’ll notify you as each one arrives.
        </Notice>
      ) : null}

      {order ? (
        <section className="mb-8 flex flex-col gap-5 rounded-3xl bg-ink p-6 text-ivory sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-accent-soft uppercase">Order {orderRef(order.order_number)}</p>
            <p className="mt-2 text-xl font-semibold">You chose {chosen?.tailor?.full_name ?? "a tailor"}.</p>
            <p className="mt-1 text-sm text-ivory/65">This request is now a private order. Follow progress and chat there.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/messages/${order.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ivory/25 px-5 text-sm font-semibold hover:border-ivory/60">
              <MessageSquare className="size-4" aria-hidden /> Chat
            </Link>
            <Link href={`/orders/${order.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ivory px-5 text-sm font-semibold text-ink hover:bg-white">
              Open order <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_21rem]">
        <section aria-labelledby="offers-title" className="order-2 lg:order-1">
          <SectionHeader
            title={<span id="offers-title">Offers</span>}
            description={
              request.status === "open"
                ? pending
                  ? `${plural(pending, "tailor")} waiting for your decision. Compare, then choose one.`
                  : "Tailors will appear here when they respond."
                : undefined
            }
          />
          <OfferBoard
            requestId={request.id}
            requestTitle={request.title}
            requestStatus={request.status}
            desiredDate={request.desired_date}
            offers={offers}
            stats={Object.fromEntries(stats)}
          />
        </section>

        <aside className="order-1 lg:order-2">
          <Card className="overflow-hidden lg:sticky lg:top-8">
            <RequestImage url={imageUrl} alt={`Reference image for ${request.title}`} className="aspect-[4/3] w-full" priority iconClassName="size-8" />
            <div className="p-5">
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Needed by">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-stone" aria-hidden />
                    {formatDate(request.desired_date, { year: undefined })}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">{describeDeadline(request.desired_date).split("·").pop()}</span>
                </Detail>
                <Detail label="Offers">{offers.length}</Detail>
              </dl>
              <details className="group mt-5 border-t border-line pt-4" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium tracking-wide text-muted uppercase">
                  Your description
                  <span className="text-base transition group-open:rotate-90" aria-hidden>›</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink/85">{request.description}</p>
                {request.ai_assisted ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent">
                    <Sparkles className="size-3.5" aria-hidden /> Started from an AI suggestion
                  </p>
                ) : null}
              </details>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
