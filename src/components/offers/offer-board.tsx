"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, CalendarCheck, CalendarX, Check, CircleCheck, Lock, MessageSquare, Package, Clock } from "lucide-react";
import { acceptOffer, declineOffer } from "@/actions/offers";
import { Avatar } from "@/components/ui/avatar";
import { Badge, OfferStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { RatingSummary } from "@/components/ui/stars";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { daysUntil, formatDate, formatDays, formatPrice, plural, timeAgo } from "@/lib/format";
import type { OfferWithTailor } from "@/lib/queries";
import type { RequestStatus, TailorStats } from "@/lib/types";

type Sort = "recommended" | "price" | "speed";

export function OfferBoard({
  requestId,
  requestTitle,
  requestStatus,
  desiredDate,
  offers,
  stats,
}: {
  requestId: string;
  requestTitle: string;
  requestStatus: RequestStatus;
  desiredDate: string;
  offers: OfferWithTailor[];
  stats: Record<string, TailorStats>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [sort, setSort] = useState<Sort>("recommended");
  const [accepting, setAccepting] = useState<OfferWithTailor | null>(null);
  const [declining, setDeclining] = useState<OfferWithTailor | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = requestStatus === "open";
  const active = offers.filter((o) => o.status === "pending");
  const declined = offers.filter((o) => o.status === "declined");
  const settled = offers.filter((o) => o.status === "accepted" || o.status === "closed");

  const lowest = active.length > 1 ? Math.min(...active.map((o) => Number(o.price))) : null;
  const fastest = active.length > 1 ? Math.min(...active.map((o) => o.turnaround_days)) : null;
  const daysLeft = daysUntil(desiredDate);

  const sorted = (() => {
    const list = [...active];
    if (sort === "price") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "speed") list.sort((a, b) => a.turnaround_days - b.turnaround_days);
    else {
      // Fits the date first, then rating, then newest.
      list.sort((a, b) => {
        const fa = a.turnaround_days <= daysLeft ? 0 : 1;
        const fb = b.turnaround_days <= daysLeft ? 0 : 1;
        if (fa !== fb) return fa - fb;
        const ra = Number(stats[a.tailor_id]?.avg_rating ?? 0);
        const rb = Number(stats[b.tailor_id]?.avg_rating ?? 0);
        if (ra !== rb) return rb - ra;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    }
    return list;
  })();

  function confirmAccept() {
    if (!accepting) return;
    setActionError(null);
    start(async () => {
      const res = await acceptOffer(requestId, accepting.id);
      if (!res.ok) {
        setActionError(res.error);
        router.refresh();
        return;
      }
      router.push(`/orders/${res.data!.orderId}?new=1`);
    });
  }

  function confirmDecline() {
    if (!declining) return;
    start(async () => {
      const res = await declineOffer(requestId, declining.id);
      setDeclining(null);
      if (res.ok) toast.success(res.message ?? "Offer declined.");
      else toast.error(res.error);
      router.refresh();
    });
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon={<Clock />}
        title="No offers yet. Tailors will appear here when they respond."
        description="Most requests receive their first offer within a day. We’ll notify you as soon as one arrives."
      />
    );
  }

  return (
    <div>
      {open ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {active.length ? (
                <>
                  <strong className="font-semibold text-ink">{plural(active.length, "offer")}</strong> ready to compare
                </>
              ) : (
                "No offers are waiting for a decision."
              )}
            </p>
            {active.length > 1 ? (
              <label className="inline-flex items-center gap-2 text-sm text-muted">
                <ArrowUpDown className="size-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-full border border-line bg-paper py-1.5 pr-3 pl-3 text-sm font-semibold text-ink focus:border-ink focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price">Lowest price</option>
                  <option value="speed">Fastest</option>
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {sorted.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                stats={stats[o.tailor_id]}
                daysLeft={daysLeft}
                badges={[
                  lowest !== null && Number(o.price) === lowest ? "Lowest price" : null,
                  fastest !== null && o.turnaround_days === fastest ? "Fastest" : null,
                ]}
                actions={
                  <>
                    <Button className="flex-1 sm:flex-none" onClick={() => { setActionError(null); setAccepting(o); }}>
                      Choose this tailor
                    </Button>
                    <Button variant="ghost" onClick={() => setDeclining(o)}>
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </div>

          {declined.length ? (
            <details className="group mt-8">
              <summary className="cursor-pointer list-none text-sm font-semibold text-muted hover:text-ink">
                <span className="inline-flex items-center gap-2">
                  Declined offers ({declined.length})
                  <span className="transition group-open:rotate-90" aria-hidden>›</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted">These tailors can still revise their offer while your request is open. Revised offers return to the list above.</p>
              <div className="mt-4 grid gap-4 opacity-80 xl:grid-cols-2">
                {declined.map((o) => (
                  <OfferCard key={o.id} offer={o} stats={stats[o.tailor_id]} daysLeft={daysLeft} />
                ))}
              </div>
            </details>
          ) : null}
        </>
      ) : (
        <>
          <Notice tone="locked" className="mb-5" title="Offers are closed">
            You chose a tailor, so this request no longer accepts or changes offers.
          </Notice>
          <div className="grid gap-4 xl:grid-cols-2">
            {[...settled, ...declined]
              .sort((a, b) => Number(b.status === "accepted") - Number(a.status === "accepted"))
              .map((o) => (
                <OfferCard key={o.id} offer={o} stats={stats[o.tailor_id]} daysLeft={daysLeft} />
              ))}
          </div>
        </>
      )}

      {/* Accept — deliberate, explained confirmation */}
      <Dialog
        open={Boolean(accepting)}
        onClose={() => (pending ? null : setAccepting(null))}
        dismissible={!pending}
        title={accepting ? `Choose ${accepting.tailor?.full_name ?? "this tailor"}?` : ""}
        description={`For “${requestTitle}”`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAccepting(null)} disabled={pending}>
              Not yet
            </Button>
            <Button onClick={confirmAccept} loading={pending} loadingText="Creating your order…">
              Yes, choose this tailor
            </Button>
          </>
        }
      >
        {accepting ? (
          <>
            <div className="flex items-center gap-4 rounded-2xl bg-cream/70 p-4">
              <Avatar name={accepting.tailor?.full_name} seed={accepting.tailor_id} />
              <div className="flex-1">
                <p className="font-semibold text-ink">{accepting.tailor?.full_name}</p>
                <p className="text-sm text-muted">Agreed terms</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-ink">{formatPrice(accepting.price)}</p>
                <p className="text-sm text-muted">{formatDays(accepting.turnaround_days)}</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-semibold text-ink">What happens next</p>
            <ul className="mt-3 space-y-3 text-sm text-ink/85">
              <Consequence icon={<Lock />}>Your request closes and stops receiving offers.</Consequence>
              <Consequence icon={<CircleCheck />}>
                {active.length + declined.length - 1 > 0
                  ? `The other ${plural(active.length + declined.length - 1, "offer")} will no longer be available.`
                  : "No other offers are affected."}
              </Consequence>
              <Consequence icon={<Package />}>An order is created at {formatPrice(accepting.price)} with a {formatDays(accepting.turnaround_days)} turnaround.</Consequence>
              <Consequence icon={<MessageSquare />}>A private chat opens between you and {accepting.tailor?.full_name ?? "the tailor"}.</Consequence>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted">This can’t be undone. Payment is arranged directly with your tailor.</p>
            {actionError ? <Notice tone="danger" className="mt-4" live>{actionError}</Notice> : null}
          </>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(declining)}
        onClose={() => setDeclining(null)}
        size="sm"
        title="Decline this offer?"
        description={
          declining
            ? `${declining.tailor?.full_name ?? "The tailor"} will be told, and can send a revised offer while your request is open.`
            : ""
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclining(null)} disabled={pending}>
              Keep offer
            </Button>
            <Button variant="danger" onClick={confirmDecline} loading={pending} loadingText="Declining…">
              Decline offer
            </Button>
          </>
        }
      />
    </div>
  );
}

function Consequence({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-accent [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

function OfferCard({
  offer,
  stats,
  daysLeft,
  badges = [],
  actions,
}: {
  offer: OfferWithTailor;
  stats?: TailorStats;
  daysLeft: number;
  badges?: (string | null)[];
  actions?: React.ReactNode;
}) {
  const t = offer.tailor;
  const readyBy = new Date();
  readyBy.setDate(readyBy.getDate() + offer.turnaround_days);
  const fits = offer.turnaround_days <= daysLeft;
  const accepted = offer.status === "accepted";

  return (
    <article
      className={cn(
        "flex flex-col rounded-[var(--radius-card)] border bg-paper p-5 shadow-soft transition sm:p-6",
        accepted ? "border-ink ring-1 ring-ink" : "border-line",
      )}
      aria-label={`Offer from ${t?.full_name ?? "a tailor"}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={t?.full_name} seed={offer.tailor_id} />
        <div className="min-w-0 flex-1">
          <Link href={`/tailors/${offer.tailor_id}`} className="block truncate font-semibold text-ink hover:underline">
            {t?.full_name ?? "Tailor"}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <RatingSummary avg={stats?.avg_rating ?? null} count={stats?.review_count ?? 0} className="text-xs" />
            {t?.city ? <span>· {t.city}</span> : null}
            {t?.years_experience ? <span>· {plural(t.years_experience, "yr")} experience</span> : null}
          </div>
        </div>
        {offer.status !== "pending" ? (
          accepted ? <Badge tone="success" dot>Chosen</Badge> : offer.status === "closed" ? <Badge>Not selected</Badge> : <OfferStatusBadge status={offer.status} />
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-ivory p-4">
        <div>
          <p className="text-xs font-medium text-muted">Price</p>
          <p className="mt-1 font-display text-3xl leading-none text-ink">{formatPrice(offer.price)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Turnaround</p>
          <p className="mt-1 font-display text-3xl leading-none text-ink">{formatDays(offer.turnaround_days)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {badges.filter(Boolean).map((b) => (
          <Badge key={b} tone="accent">
            {b}
          </Badge>
        ))}
        {offer.status === "pending" || offer.status === "declined" ? (
          fits ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CalendarCheck className="size-3.5" aria-hidden /> Ready around {formatDate(readyBy, { year: undefined })} — before your date
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
              <CalendarX className="size-3.5" aria-hidden /> May finish after your date
            </span>
          )
        ) : null}
      </div>

      <blockquote className="mt-4 flex-1 text-[0.92rem] leading-relaxed text-ink/85">“{offer.message}”</blockquote>

      {t?.specialties?.length ? (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Specialties">
          {t.specialties.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-cream px-2.5 py-1 text-[0.7rem] font-medium text-muted">
              {s}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs text-muted">
        {offer.revision > 1 ? (
          <>
            <Check className="mr-1 inline size-3" aria-hidden />
            Revised {timeAgo(offer.updated_at)}
          </>
        ) : (
          <>Sent {timeAgo(offer.created_at)}</>
        )}
      </p>

      {actions ? <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">{actions}</div> : null}
    </article>
  );
}
