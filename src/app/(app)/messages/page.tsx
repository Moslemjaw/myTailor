import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { requireViewer } from "@/lib/auth";
import { orderRef, timeAgo } from "@/lib/format";
import { getConversations } from "@/lib/queries";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const viewer = await requireViewer();
  const role = viewer.profile.role;
  const conversations = await getConversations(viewer.id, role);

  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Order conversations"
        description="Each order has its own private chat between you and the other person on that order."
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<Lock />}
          title="Chat is available after an offer is accepted."
          description={
            role === "customer"
              ? "Choose a tailor on one of your requests and a private conversation for that order opens here."
              : "When a customer accepts your offer, a private conversation for that order opens here."
          }
          action={
            role === "customer" ? (
              <ButtonLink href="/requests" variant="secondary">View my requests</ButtonLink>
            ) : (
              <ButtonLink href="/browse" variant="secondary">Browse requests</ButtonLink>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper shadow-soft">
          {conversations.map((c) => {
            const other = role === "customer" ? c.tailor : c.customer;
            const mine = c.last?.sender_id === viewer.id;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 transition hover:bg-cream/40 sm:p-5">
                  <Avatar name={other?.full_name} seed={other?.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-ink">{other?.full_name}</p>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(c.last?.created_at ?? c.created_at)}</span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      Order {orderRef(c.order_number)} · {c.request?.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-ink/75">
                      {c.last ? (
                        <>
                          {mine ? <span className="text-muted">You: </span> : null}
                          {c.last.body}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <MessageSquare className="size-3.5" aria-hidden /> Start the conversation about your order.
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <OrderStatusBadge status={c.status} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-stone" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
