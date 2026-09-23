import type { Metadata } from "next";
import Link from "next/link";
import { Compass, EyeOff } from "lucide-react";
import { FeedRequestCard } from "@/components/requests/request-cards";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { requireRole } from "@/lib/auth";
import { GARMENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { signImagePaths } from "@/lib/images";
import { getTailorFeed } from "@/lib/queries";

export const metadata: Metadata = { title: "Browse requests" };

type Search = { type?: string; sort?: string; show?: string };

function href(current: Search, patch: Search) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  await requireRole("tailor");
  const sp = (await searchParams) as Search;
  const type = GARMENT_TYPES.some((g) => g.value === sp.type) ? sp.type : undefined;
  const sort = sp.sort === "deadline" || sp.sort === "fewest" ? sp.sort : "newest";
  const show = sp.show === "all" ? "all" : "new";

  const feed = await getTailorFeed();
  let list = feed.filter((r) => (type ? r.garment_type === type : true));
  if (show === "new") list = list.filter((r) => !r.my_offer_status);
  if (sort === "deadline") list = [...list].sort((a, b) => a.desired_date.localeCompare(b.desired_date));
  if (sort === "fewest") list = [...list].sort((a, b) => a.offer_count - b.offer_count);

  const images = await signImagePaths(list.map((r) => r.image_path));
  const current: Search = { type, sort: sort === "newest" ? undefined : sort, show: show === "new" ? undefined : show };

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Browse requests"
        description="Open requests from customers looking for a tailor. Find one that suits your skills and send an offer."
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-paper p-4 text-sm text-muted">
        <EyeOff className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p>
          <strong className="font-semibold text-ink">Offers are blind.</strong> You’ll see how many offers a request has —
          never another tailor’s price, timing or message. They can’t see yours either.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2" aria-label="Garment type">
            <Chip href={href(current, { type: undefined })} active={!type}>
              All garments
            </Chip>
            {GARMENT_TYPES.map((g) => (
              <Chip key={g.value} href={href(current, { type: g.value })} active={type === g.value}>
                {g.label}
              </Chip>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex gap-1 rounded-full border border-line bg-paper p-1" role="group" aria-label="Show">
            <Seg href={href(current, { show: undefined })} active={show === "new"}>
              Not yet offered
            </Seg>
            <Seg href={href(current, { show: "all" })} active={show === "all"}>
              All open
            </Seg>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <span>Sort:</span>
            <Seg href={href(current, { sort: undefined })} active={sort === "newest"} plain>
              Newest
            </Seg>
            <Seg href={href(current, { sort: "deadline" })} active={sort === "deadline"} plain>
              Soonest date
            </Seg>
            <Seg href={href(current, { sort: "fewest" })} active={sort === "fewest"} plain>
              Fewest offers
            </Seg>
          </div>
        </div>
      </div>

      {list.length ? (
        <>
          <p className="mb-4 text-sm text-muted" role="status">
            {list.length} {list.length === 1 ? "request" : "requests"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((r) => (
              <FeedRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Compass />}
          title="No requests are currently available."
          description={
            feed.length && (type || show === "new")
              ? "Nothing matches these filters. Try another garment type or show all open requests."
              : "New customer requests appear here as soon as they’re posted. Check back soon."
          }
          action={
            type || show === "new" ? (
              <Link href="/browse?show=all" className="text-sm font-semibold text-ink underline underline-offset-4">
                Show all open requests
              </Link>
            ) : null
          }
        />
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition",
          active ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-stone",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

function Seg({ href, active, children, plain }: { href: string; active: boolean; children: React.ReactNode; plain?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full px-3 py-1.5 font-semibold whitespace-nowrap transition",
        plain
          ? active
            ? "text-ink underline decoration-accent decoration-2 underline-offset-4"
            : "text-muted hover:text-ink"
          : active
            ? "bg-ink text-ivory"
            : "text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
