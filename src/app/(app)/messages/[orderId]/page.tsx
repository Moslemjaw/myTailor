import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/ui/badge";
import { requireViewer } from "@/lib/auth";
import { orderRef } from "@/lib/format";
import { getMessages, getOrderDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ params }: PageProps<"/messages/[orderId]">) {
  const { orderId } = await params;
  const viewer = await requireViewer();
  const detail = await getOrderDetail(orderId);
  // Not a participant → no order, no messages.
  if (!detail) notFound();

  const { order, request } = detail;
  const role = viewer.id === order.customer_id ? "customer" : "tailor";
  const counterpart = role === "customer" ? order.tailor : order.customer;
  const messages = await getMessages(orderId);

  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0">
      <ChatPanel
        orderId={order.id}
        me={viewer.id}
        names={{
          [order.customer_id]: order.customer?.full_name ?? "Customer",
          [order.tailor_id]: order.tailor?.full_name ?? "Tailor",
        }}
        counterpartName={counterpart?.full_name ?? (role === "customer" ? "your tailor" : "your customer")}
        initialMessages={messages}
        className="h-[calc(100dvh-4rem-4.75rem-env(safe-area-inset-bottom))] rounded-none border-x-0 border-t-0 sm:h-[calc(100dvh-11rem)] sm:rounded-[var(--radius-card)] sm:border lg:h-[calc(100dvh-7rem)]"
        header={
          <div className="flex items-center gap-3 border-b border-line bg-paper p-3 sm:p-4">
            <Link href="/messages" className="rounded-full p-2 text-muted hover:bg-cream hover:text-ink" aria-label="Back to messages">
              <ArrowLeft className="size-5" />
            </Link>
            <Avatar name={counterpart?.full_name} seed={counterpart?.id} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{counterpart?.full_name}</p>
              <p className="truncate text-xs text-muted">
                Order {orderRef(order.order_number)} · {request?.title}
              </p>
            </div>
            <div className="hidden sm:block">
              <OrderStatusBadge status={order.status} />
            </div>
            <Link
              href={`/orders/${order.id}`}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-stone"
            >
              View order
            </Link>
          </div>
        }
      />
    </div>
  );
}
