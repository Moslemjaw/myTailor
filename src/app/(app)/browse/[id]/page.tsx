import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, EyeOff, MapPin, Shirt } from "lucide-react";
import { TailorOfferPanel } from "@/components/offers/tailor-offer-panel";
import { CompetitionLabel } from "@/components/requests/request-cards";
import { RequestImage } from "@/components/requests/request-image";
import { RequestStatusBadge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/nav-bits";
import { requireRole } from "@/lib/auth";
import { garmentLabel } from "@/lib/constants";
import { daysUntil, describeDeadline, formatDate, timeAgo } from "@/lib/format";
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
  const edited = new Date(request.updated_at).getTime() - new Date(request.created_at).getTime() > 60_000;

  return (
    <>
      <div className="mb-6">
        <BackLink href="/browse">Browse requests</BackLink>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <article className="min-w-0 animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <span className="text-sm text-muted">
              Posted {timeAgo(request.created_at)}
              {edited ? ` · updated ${timeAgo(request.updated_at)}` : ""}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[2.4rem] leading-[1.05] text-ink md:text-5xl">{request.title}</h1>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-4 sm:p-5">
            <Fact icon={<Shirt />} label="Garment" value={garmentLabel(request.garment_type)} />
            <Fact icon={<CalendarDays />} label="Needed by" value={formatDate(request.desired_date, { year: undefined })} />
            <Fact icon={<Clock />} label="Time left" value={describeDeadline(request.desired_date).split("·").pop()!.trim()} />
            <Fact icon={<MapPin />} label="Customer in" value={request.customer?.city ?? "Not shared"} />
          </dl>

          <RequestImage
            url={imageUrl}
            alt={`Customer’s reference image for ${request.title}`}
            className="mt-6 aspect-[4/3] w-full rounded-3xl sm:aspect-[16/10]"
            priority
            iconClassName="size-10"
          />
          {!imageUrl ? <p className="mt-2 text-xs text-muted">The customer didn’t add a reference image.</p> : null}

          <section className="mt-8">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">What the customer wants</h2>
            <p className="mt-3 text-[1.02rem] leading-relaxed whitespace-pre-line text-ink/90">{request.description}</p>
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
            <CompetitionLabel count={offerCount} />
            <span className="inline-flex items-center gap-1 text-xs text-muted" title="Other offers are private">
              <EyeOff className="size-3.5" aria-hidden /> Blind
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

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
