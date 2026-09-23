"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, History, Lock, PartyPopper, Pencil } from "lucide-react";
import { OfferStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { formatDate, formatDays, formatPrice, formatTime, orderRef, timeAgo } from "@/lib/format";
import type { Offer, OfferRevision, Order, RequestStatus } from "@/lib/types";
import { OfferForm } from "./offer-form";

export function TailorOfferPanel({
  requestId,
  requestStatus,
  myOffer,
  revisions,
  order,
  daysLeft,
}: {
  requestId: string;
  requestStatus: RequestStatus;
  myOffer: Offer | null;
  revisions: OfferRevision[];
  order: Pick<Order, "id" | "order_number" | "status"> | null;
  daysLeft: number;
}) {
  const [editing, setEditing] = useState(false);
  const open = requestStatus === "open";

  // Selected → the relationship moves to the order.
  if (myOffer?.status === "accepted" && order) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-ink p-6 text-ivory">
          <PartyPopper className="size-6 text-accent-soft" aria-hidden />
          <p className="mt-4 text-xl font-semibold">You were selected</p>
          <p className="mt-1 text-sm text-ivory/70">
            The customer accepted your offer. This is now order {orderRef(order.order_number)}.
          </p>
        </div>
        <div className="p-6">
          <OfferSummary offer={myOffer} />
          <Link
            href={`/orders/${order.id}`}
            className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-ivory hover:bg-charcoal"
          >
            Open order <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Card>
    );
  }

  // No offer yet.
  if (!myOffer) {
    if (!open) {
      return (
        <Notice tone="locked" title="This request is no longer accepting offers.">
          The customer has already chosen a tailor.
        </Notice>
      );
    }
    return (
      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-3xl text-ink">Submit an offer</h2>
        <p className="mt-1 mb-6 text-sm text-muted">Your price, how long you need, and a note on your approach.</p>
        <OfferForm requestId={requestId} existing={null} daysLeft={daysLeft} />
      </Card>
    );
  }

  // Existing offer.
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ink">Your offer</h2>
          <p className="mt-1 text-xs text-muted">
            {myOffer.revision > 1 ? `Revision ${myOffer.revision} · updated ${timeAgo(myOffer.updated_at)}` : `Sent ${timeAgo(myOffer.created_at)}`}
          </p>
        </div>
        {myOffer.status === "closed" ? <OfferStatusBadge status="closed" /> : <OfferStatusBadge status={myOffer.status} />}
      </div>

      {myOffer.status === "declined" && open ? (
        <Notice tone="warning" className="mt-5" title="The customer declined this offer">
          You can revise it while the request remains open — a revised offer goes back to the customer.
        </Notice>
      ) : null}
      {myOffer.status === "closed" || !open ? (
        <Notice tone="locked" className="mt-5" title="Offer frozen">
          The customer chose another tailor, so this offer can no longer be changed. Thank you for taking part.
        </Notice>
      ) : null}

      {editing && open ? (
        <div className="mt-6">
          <OfferForm
            requestId={requestId}
            existing={myOffer}
            daysLeft={daysLeft}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="mt-5">
            <OfferSummary offer={myOffer} />
          </div>
          {open ? (
            <Button
              variant={myOffer.status === "declined" ? "primary" : "secondary"}
              className="mt-6 w-full"
              icon={<Pencil className="size-4" />}
              onClick={() => setEditing(true)}
            >
              {myOffer.status === "declined" ? "Revise offer" : "Edit offer"}
            </Button>
          ) : (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Lock className="size-4" aria-hidden /> Editing is closed for this request.
            </p>
          )}
          {open && myOffer.status === "pending" ? (
            <p className="mt-3 text-center text-xs text-muted">Waiting for the customer to decide. You can still revise it.</p>
          ) : null}
        </>
      )}

      {revisions.length > 1 ? (
        <details className="group mt-6 border-t border-line pt-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink">
            <History className="size-4 text-muted" aria-hidden />
            Revision history ({revisions.length})
            <span className="ml-auto text-muted transition group-open:rotate-90" aria-hidden>›</span>
          </summary>
          <ol className="mt-4 space-y-3">
            {revisions.map((r) => (
              <li key={r.id} className="rounded-xl bg-ivory p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">
                    Revision {r.revision}
                    {r.revision === myOffer.revision ? <span className="ml-2 text-xs font-medium text-accent">Current</span> : null}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(r.created_at, { year: undefined })}, {formatTime(r.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-muted">
                  {formatPrice(r.price)} · {formatDays(r.turnaround_days)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">Only you can see your revision history.</p>
        </details>
      ) : null}
    </Card>
  );
}

function OfferSummary({ offer }: { offer: Offer }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-ivory p-4">
        <div>
          <p className="text-xs font-medium text-muted">Price</p>
          <p className="mt-1 font-display text-3xl leading-none text-ink">{formatPrice(offer.price)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Turnaround</p>
          <p className="mt-1 font-display text-3xl leading-none text-ink">{formatDays(offer.turnaround_days)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink/85">“{offer.message}”</p>
    </>
  );
}
