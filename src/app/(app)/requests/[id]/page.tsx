import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Pencil, Sparkles } from "lucide-react";
import { OfferBoard } from "@/components/offers/offer-board";
import { MeasurementSummary } from "@/components/requests/measurement-summary";
import { RequestImage } from "@/components/requests/request-image";
import { RequestStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Detail } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { garmentLabel } from "@/lib/constants";
import { formatDate, orderRef } from "@/lib/format";
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

  const { request, offers, stats, order, measurements } = detail;
  const imageUrl = await signImagePath(request.image_path);
  const chosen = offers.find((o) => o.status === "accepted");

  return (
    <>
      <div className="mb-6">
        <BackLink href="/requests">My requests</BackLink>
      </div>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">{request.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <RequestStatusBadge status={request.status} />
            <span>{garmentLabel(request.garment_type)}</span>
            <span aria-hidden>·</span>
            <span>Needed by {formatDate(request.desired_date, { year: undefined })}</span>
          </div>
        </div>
        {request.status === "open" ? (
          <ButtonLink href={`/requests/${id}/edit`} variant="secondary" size="sm" icon={<Pencil className="size-3.5" />}>
            Edit
          </ButtonLink>
        ) : null}
      </header>

      {sp.created === "1" ? (
        <Notice tone="success" className="mb-8" title="Your request is live" live>
          We’ll notify you as offers arrive.
        </Notice>
      ) : null}

      {order ? (
        <Link
          href={`/orders/${order.id}`}
          className="group mb-8 flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-ink px-5 py-4 text-ivory transition hover:bg-charcoal"
        >
          <span>
            <span className="block font-semibold">You chose {chosen?.tailor?.full_name ?? "a tailor"}</span>
            <span className="text-sm text-ivory/70">Order {orderRef(order.order_number)} · chat and progress are in the order</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            Open order <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:gap-10">
        <section aria-labelledby="offers-title" className="order-2 min-w-0 lg:order-1">
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
            {imageUrl ? <RequestImage url={imageUrl} alt={`Reference image for ${request.title}`} className="aspect-[4/3] w-full" priority /> : null}
            <div className="p-5">
              <dl>
                <Detail label="Your description">
                  <span className="line-clamp-6 text-sm leading-relaxed font-normal whitespace-pre-line text-ink/85">{request.description}</span>
                </Detail>
              </dl>
              {request.ai_assisted ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
                  <Sparkles className="size-3.5" aria-hidden /> Started from an AI suggestion
                </p>
              ) : null}
              <div className="mt-5 border-t border-line pt-4">
                <MeasurementSummary
                  size={request.size}
                  measurements={measurements}
                  note={order ? "Shared with your tailor" : "Shared only with the tailor you choose"}
                />
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
