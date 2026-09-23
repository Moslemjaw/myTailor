import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquare, Star } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { OrderProgress } from "@/components/orders/order-progress";
import { StatusAdvancer } from "@/components/orders/status-advancer";
import { RequestImage } from "@/components/requests/request-image";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, Detail } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { Stars } from "@/components/ui/stars";
import { requireViewer } from "@/lib/auth";
import { ORDER_STATUS, garmentLabel } from "@/lib/constants";
import { formatDate, formatDays, formatPrice, formatTime, orderRef } from "@/lib/format";
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

  const { order, request, offerMessage, events, review } = detail;
  const role = viewer.id === order.customer_id ? "customer" : "tailor";
  const counterpart = role === "customer" ? order.tailor : order.customer;
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

      {sp.new === "1" && role === "customer" ? (
        <Notice tone="success" className="mb-6" title={`Order ${orderRef(order.order_number)} created`} live>
          Your request is now closed and {counterpart?.full_name ?? "your tailor"} has been told. Use the chat to agree
          measurements and fittings.
        </Notice>
      ) : null}

      <header className="mb-8 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted">Order {orderRef(order.order_number)}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <h1 className="mt-3 font-display text-[2.4rem] leading-[1.05] text-ink md:text-5xl">{request?.title ?? "Order"}</h1>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={counterpart?.full_name} seed={counterpart?.id} size="sm" />
          <p className="text-sm text-muted">
            {role === "customer" ? "Made by " : "For "}
            {role === "customer" ? (
              <Link href={`/tailors/${order.tailor_id}`} className="font-semibold text-ink hover:underline">
                {counterpart?.full_name}
              </Link>
            ) : (
              <span className="font-semibold text-ink">{counterpart?.full_name}</span>
            )}
            {counterpart?.city ? ` · ${counterpart.city}` : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_27rem]">
        <div className="min-w-0 space-y-6">
          {/* Progress */}
          <Card className="p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Progress</h2>
              <span className="text-sm text-muted">{ORDER_STATUS[order.status].label}</span>
            </div>
            <OrderProgress
              status={order.status}
              timestamps={{
                accepted: order.created_at,
                in_progress: order.started_at,
                ready: order.ready_at,
                completed: order.completed_at,
              }}
            />
            <div className="mt-6">
              {role === "tailor" ? (
                <StatusAdvancer orderId={order.id} status={order.status} customerName={order.customer?.full_name ?? "your customer"} />
              ) : order.status !== "completed" ? (
                <p className="rounded-2xl bg-ivory p-4 text-sm text-muted">
                  {order.tailor?.full_name ?? "Your tailor"} updates this as work progresses. You’ll be notified at each stage.
                </p>
              ) : null}
              {role === "tailor" && order.status === "completed" ? (
                <Notice tone="success" title="Order completed">
                  Well done. {review ? "Your customer has left a review." : "Your customer can now leave a review."}
                </Notice>
              ) : null}
            </div>
          </Card>

          {/* Review */}
          {order.status === "completed" ? (
            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-ink">Review</h2>
              {review ? (
                <div className="mt-4">
                  <Stars value={review.rating} size="md" />
                  {review.comment ? <p className="mt-3 leading-relaxed text-ink/85">“{review.comment}”</p> : null}
                  <p className="mt-3 text-xs text-muted">
                    {role === "customer" ? "Your review" : `From ${order.customer?.full_name}`} · {formatDate(review.created_at)}
                  </p>
                </div>
              ) : role === "customer" ? (
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">How was your experience with {order.tailor?.full_name}? Your review helps others choose.</p>
                  <ButtonLink href={`/orders/${order.id}/review`} icon={<Star className="size-4" />}>
                    Leave a review
                  </ButtonLink>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Waiting for {order.customer?.full_name ?? "the customer"} to leave a review.</p>
              )}
            </Card>
          ) : role === "customer" ? (
            <p className="px-1 text-xs text-muted">You can review this order after it is completed.</p>
          ) : null}

          {/* Mobile chat entry */}
          <Link
            href={`/messages/${order.id}`}
            className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 shadow-soft transition hover:border-stone lg:hidden"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-cream text-accent">
              <MessageSquare className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">Chat with {counterpart?.full_name}</span>
              <span className="block truncate text-sm text-muted">
                {messages.length ? messages[messages.length - 1].body : "Start the conversation about your order."}
              </span>
            </span>
            <ArrowRight className="size-4 text-stone" aria-hidden />
          </Link>

          {/* Agreement */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Agreed terms</h2>
            <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <Detail label="Price">{formatPrice(order.price)}</Detail>
              <Detail label="Turnaround">{formatDays(order.turnaround_days)}</Detail>
              <Detail label="Expected ready">{formatDate(expectedReady, { year: undefined })}</Detail>
              <Detail label="Customer">{order.customer?.full_name}</Detail>
              <Detail label="Tailor">{order.tailor?.full_name}</Detail>
              {request?.desired_date ? <Detail label="Needed by">{formatDate(request.desired_date, { year: undefined })}</Detail> : null}
            </dl>
            {offerMessage ? (
              <div className="mt-6 rounded-2xl bg-ivory p-4">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tailor’s offer note</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/85">“{offerMessage}”</p>
              </div>
            ) : null}
            <p className="mt-5 text-xs text-muted">Payment is arranged directly between customer and tailor.</p>
          </Card>

          {/* Original request */}
          {request ? (
            <Card className="overflow-hidden">
              <div className="grid sm:grid-cols-[14rem_1fr]">
                <RequestImage url={imageUrl} alt={`Reference image for ${request.title}`} className="aspect-[4/3] sm:aspect-auto sm:h-full" iconClassName="size-8" />
                <div className="p-5 sm:p-6">
                  <p className="text-xs font-semibold tracking-wide text-muted uppercase">Original request · {garmentLabel(request.garment_type)}</p>
                  <p className="mt-2 font-semibold text-ink">{request.title}</p>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink/80">{request.description}</p>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Activity */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-ink">Order history</h2>
            <ol className="mt-4 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 text-sm">
                  <span className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-stone" aria-hidden />
                  <span className="flex-1 text-ink/85">
                    {e.to_status === "accepted"
                      ? "Offer accepted and order created"
                      : e.to_status === "in_progress"
                        ? "Work started"
                        : e.to_status === "ready"
                          ? "Marked as ready"
                          : "Order completed"}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(e.created_at, { year: undefined })}, {formatTime(e.created_at)}
                  </span>
                </li>
              ))}
              {review ? (
                <li className="flex items-baseline gap-3 text-sm">
                  <span className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-accent" aria-hidden />
                  <span className="flex-1 text-ink/85">Review published</span>
                  <span className="text-xs text-muted">
                    {formatDate(review.created_at, { year: undefined })}, {formatTime(review.created_at)}
                  </span>
                </li>
              ) : null}
            </ol>
          </Card>
        </div>

        {/* Desktop chat */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <ChatPanel
              orderId={order.id}
              me={viewer.id}
              names={names}
              counterpartName={counterpart?.full_name ?? (role === "customer" ? "your tailor" : "your customer")}
              initialMessages={messages}
              className="h-[calc(100dvh-4rem)] max-h-[46rem]"
              header={
                <div className="flex items-center gap-3 border-b border-line p-4">
                  <Avatar name={counterpart?.full_name} seed={counterpart?.id} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{counterpart?.full_name}</p>
                    <p className="text-xs text-muted">Order {orderRef(order.order_number)} chat</p>
                  </div>
                </div>
              }
            />
          </div>
        </aside>
      </div>
    </>
  );
}
