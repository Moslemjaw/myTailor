import type { Metadata } from "next";
import Link from "next/link";
import { Compass, EyeOff } from "lucide-react";
import { FeedRequestCard } from "@/components/requests/request-cards";
import { PageHeader, RowList } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { GarmentIcon } from "@/components/ui/garment-icon";
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

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "deadline", label: "Soonest date" },
  { key: "fewest", label: "Fewest offers" },
];

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
        title="Browse requests"
        description={
          <span className="inline-flex items-center gap-1.5">
            <EyeOff className="size-3.5" aria-hidden /> Offers are blind — no one sees another tailor’s price.
          </span>
        }
      />

      {/* Garment filter */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2" aria-label="Garment type">
          <Chip href={href(current, { type: undefined })} active={!type}>
            All
          </Chip>
          {GARMENT_TYPES.map((g) => (
            <Chip key={g.value} href={href(current, { type: g.value })} active={type === g.value} icon={<GarmentIcon type={g.value} className="size-4" />}>
              {g.label}
            </Chip>
          ))}
        </ul>
      </div>

      {/* View + sort */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        <div className="flex gap-4" role="group" aria-label="Show">
          <TextLink href={href(current, { show: undefined })} active={show === "new"}>
            Not offered yet
          </TextLink>
          <TextLink href={href(current, { show: "all" })} active={show === "all"}>
            All open
          </TextLink>
        </div>
        <div className="flex items-center gap-4 text-muted" role="group" aria-label="Sort">
          {SORTS.map((s) => (
            <TextLink key={s.key} href={href(current, { sort: s.key === "newest" ? undefined : s.key })} active={sort === s.key}>
              {s.label}
            </TextLink>
          ))}
        </div>
      </div>

      {list.length ? (
        <RowList label={`${list.length} requests`}>
          {list.map((r) => (
            <FeedRequestCard key={r.id} request={r} imageUrl={r.image_path ? images.get(r.image_path) : null} />
          ))}
        </RowList>
      ) : (
        <EmptyState
          icon={<Compass />}
          title="No requests are currently available."
          description={feed.length && (type || show === "new") ? "Nothing matches these filters." : "New requests appear here as soon as they’re posted."}
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

function Chip({ href, active, icon, children }: { href: string; active: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        scroll={false}
        aria-current={active ? "true" : undefined}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition",
          active ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-stone",
        )}
      >
        {icon}
        {children}
      </Link>
    </li>
  );
}

function TextLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn("whitespace-nowrap transition", active ? "font-semibold text-ink" : "text-muted hover:text-ink")}
    >
      {children}
    </Link>
  );
}
