import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageSquare, Star } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { OrderProgress } from "@/components/orders/order-progress";
import { StatusAdvancer } from "@/components/orders/status-advancer";
import { MeasurementSummary } from "@/components/requests/measurement-summary";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Detail } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { GarmentThumb } from "@/components/ui/garment-icon";
import { BackLink } from "@/components/ui/nav-bits";
import { Stars } from "@/components/ui/stars";
import { requireViewer } from "@/lib/auth";
import { formatDate, formatDays, formatPrice, orderRef } from "@/lib/format";
import { signImagePath } from "@/lib/images";
import { getMessages, getOrderDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await requireViewer();
  const detail = await getOrderDetail(id);
  // RLS returns nothing for non-participants: indistinguishable from "doesn't exist".
  if (!detail) notFound();

  const { order, request, offerMessage, review, measurements } = detail;
  const role = viewer.id === order.customer_id ? "customer" : "tailor";
  const counterpart = role === "customer" ? order.tailor : order.customer;
  const counterpartName = counterpart?.full_name ?? (role === "customer" ? "your tailor" : "your customer");
  const [messages, imageUrl] = await Promise.all([getMessages(id), signImagePath(request?.image_path)]);

  const expectedReady = new Date(order.created_at);
  expectedReady.setDate(expectedReady.getDate() + order.turnaround_days);
  const names = {
    [order.customer_id]: order.customer?.full_name ?? "Customer",
    [order.tailor_id]: order.tailor?.full_name ?? "Tailor",
  };

  return (
    <>
      <div className="mb-6">
        <BackLink href="/orders">Orders</BackLink>
      </div>

      <header className="mb-8">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">{request?.title ?? "Order"}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <OrderStatusBadge status={order.status} />
          <span>Order {orderRef(order.order_number)}</span>
          <span className="inline-flex items-center gap-1">
            {role === "customer" ? "Made by" : "For"}
            {role === "customer" ? (
              <Link href={`/tailors/${order.tailor_id}`} className="font-medium text-ink hover:underline">
                {counterpart?.full_name}
              </Link>
            ) : (
              <span className="font-medium text-ink">{counterpart?.full_name}</span>
            )}
          </span>
        </div>
      </header>

      {sp.new === "1" && role === "customer" ? (
        <Notice tone="success" className="mb-8" title={`Order ${orderRef(order.order_number)} created`} live>
          Say hello to {counterpartName} and agree on measurements.
        </Notice>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-4">
          {/* Progress + the one next action */}
          <Card className="p-5 sm:p-6">
            <h2 className="sr-only">Progress</h2>
            <OrderProgress
              status={order.status}
              timestamps={{
                accepted: order.created_at,
                in_progress: order.started_at,
                ready: order.ready_at,
                completed: order.completed_at,
              }}
            />

            {role === "tailor" && order.status !== "completed" ? (
              <div className="mt-6 border-t border-line pt-5">
                <StatusAdvancer orderId={order.id} status={order.status} customerName={order.customer?.full_name ?? "your customer"} />
              </div>
            ) : null}

            {order.status === "completed" ? (
              <div className="mt-6 border-t border-line pt-5">
                {review ? (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={review.rating} size="md" />
                      <span className="text-xs text-muted">
                        {role === "customer" ? "Your review" : `From ${order.customer?.full_name}`} · {formatDate(review.created_at, { year: undefined })}
                      </span>
                    </div>
                    {review.comment ? <p className="mt-3 leading-relaxed text-ink/85">{review.comment}</p> : null}
                  </div>
                ) : role === "customer" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted">How was working with {order.tailor?.full_name}?</p>
                    <ButtonLink href={`/orders/${order.id}/review`} icon={<Star className="size-4" />}>
                      Leave a review
                    </ButtonLink>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Completed. Waiting for {order.customer?.full_name ?? "the customer"}’s review.</p>
                )}
              </div>
            ) : role === "customer" ? (
              <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
                {order.tailor?.full_name ?? "Your tailor"} updates this as work progresses.
              </p>
            ) : null}
          </Card>

          {/* Chat entry on small screens */}
          <Link
            href={`/messages/${order.id}`}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper px-5 py-4 transition hover:bg-ivory lg:hidden"
          >
            <MessageSquare className="size-5 shrink-0 text-charcoal" strokeWidth={1.5} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">Chat with {counterpartName}</span>
              <span className="block truncate text-sm text-muted">
                {messages.length ? messages[messages.length - 1].body : "Start the conversation about your order."}
              </span>
            </span>
            <ChevronRight className="size-4 text-stone" aria-hidden />
          </Link>

          {/* Everything agreed, in one place */}
          <Card className="p-5 sm:p-6">
            <h2 className="mb-5 text-[0.95rem] font-semibold text-ink">Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Detail label="Price">{formatPrice(order.price)}</Detail>
              <Detail label="Turnaround">{formatDays(order.turnaround_days)}</Detail>
              <Detail label="Expected">{formatDate(expectedReady, { year: undefined })}</Detail>
              {request?.desired_date ? <Detail label="Needed by">{formatDate(request.desired_date, { year: undefined })}</Detail> : null}
            </dl>

            {request ? (
              <div className="mt-6 flex gap-4 border-t border-line pt-5">
                <GarmentThumb type={request.garment_type} imageUrl={imageUrl} size="lg" alt={`Reference image for ${request.title}`} />
                <div className="min-w-0">
                  <p className="text-[0.8rem] text-muted">Original request</p>
                  <p className="mt-1 line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-ink/85">{request.description}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-line pt-5">
              <p className="mb-3 text-[0.8rem] text-muted">Size &amp; measurements</p>
              <MeasurementSummary
                size={request?.size ?? null}
                measurements={measurements}
                note={role === "customer" ? "Shared with your tailor only" : "Private — only you and the customer can see these"}
              />
            </div>

            {offerMessage ? (
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-[0.8rem] text-muted">Tailor’s note</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/85">{offerMessage}</p>
              </div>
            ) : null}
            <p className="mt-5 text-xs text-muted">Payment is arranged directly between you.</p>
          </Card>
        </div>

        {/* Desktop chat */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <ChatPanel
              orderId={order.id}
              me={viewer.id}
              names={names}
              counterpartName={counterpartName}
              initialMessages={messages}
              className="h-[calc(100dvh-4rem)] max-h-[44rem]"
              header={
                <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                  <Avatar name={counterpart?.full_name} seed={counterpart?.id} size="sm" />
                  <p className="truncate text-sm font-semibold text-ink">{counterpart?.full_name}</p>
                </div>
              }
            />
          </div>
        </aside>
      </div>
    </>
  );
}
