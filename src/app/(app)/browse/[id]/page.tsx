import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EyeOff } from "lucide-react";
import { TailorOfferPanel } from "@/components/offers/tailor-offer-panel";
import { CompetitionLabel } from "@/components/requests/request-cards";
import { RequestImage } from "@/components/requests/request-image";
import { RequestStatusBadge } from "@/components/ui/badge";
import { GarmentIcon } from "@/components/ui/garment-icon";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { garmentLabel } from "@/lib/constants";
import { daysUntil, formatDate, timeAgo } from "@/lib/format";
import { signImagePath } from "@/lib/images";
import { getTailorRequestDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Request" };

export default async function TailorRequestPage({ params }: PageProps<"/browse/[id]">) {
  const { id } = await params;
  const viewer = await requireRole("tailor");
  const detail = await getTailorRequestDetail(id, viewer.id);
  if (!detail) notFound();

  const { request, myOffer, revisions, offerCount, order } = detail;
  const imageUrl = await signImagePath(request.image_path);
  const daysLeft = daysUntil(request.desired_date);

  return (
    <>
      <div className="mb-6">
        <BackLink href="/browse">Browse requests</BackLink>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink md:text-[2rem]">{request.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <RequestStatusBadge status={request.status} />
            <span className="inline-flex items-center gap-1.5">
              <GarmentIcon type={request.garment_type} className="size-4" /> {garmentLabel(request.garment_type)}
            </span>
            <span aria-hidden>·</span>
            <span>
              Needed by {formatDate(request.desired_date, { year: undefined })}
              {daysLeft >= 0 ? ` (${daysLeft} days)` : ""}
            </span>
            {request.customer?.city ? (
              <>
                <span aria-hidden>·</span>
                <span>{request.customer.city}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>Posted {timeAgo(request.created_at)}</span>
          </div>

          {imageUrl ? (
            <RequestImage
              url={imageUrl}
              alt={`Customer’s reference image for ${request.title}`}
              className="mt-8 aspect-[4/3] w-full max-w-2xl rounded-[var(--radius-card)] border border-line"
              priority
            />
          ) : null}

          <p className="mt-8 max-w-2xl text-[1.02rem] leading-relaxed whitespace-pre-line text-ink/90">{request.description}</p>
        </article>

        <aside className="space-y-3 lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center justify-between px-1 text-sm text-muted">
            <CompetitionLabel count={offerCount} />
            <span className="inline-flex items-center gap-1" title="Other tailors’ offers are private">
              <EyeOff className="size-3.5" aria-hidden /> Blind offers
            </span>
          </div>
          <TailorOfferPanel
            requestId={request.id}
            requestStatus={request.status}
            myOffer={myOffer}
            revisions={revisions}
            order={order}
            daysLeft={daysLeft}
          />
        </aside>
      </div>
    </>
  );
}
