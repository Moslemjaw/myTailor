import Link from "next/link";
import {
  Bell,
  CircleCheck,
  CircleX,
  FileText,
  Hammer,
  Handshake,
  PackageCheck,
  PencilLine,
  Star,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/types";

const ICONS: Record<string, { icon: React.ReactNode; cls: string }> = {
  offer_received: { icon: <Tag />, cls: "bg-accent-soft text-accent-strong" },
  offer_revised: { icon: <PencilLine />, cls: "bg-accent-soft text-accent-strong" },
  offer_declined: { icon: <CircleX />, cls: "bg-danger-soft text-danger" },
  offer_accepted: { icon: <Handshake />, cls: "bg-success-soft text-success" },
  offer_closed: { icon: <FileText />, cls: "bg-cream text-muted" },
  order_created: { icon: <Handshake />, cls: "bg-success-soft text-success" },
  order_in_progress: { icon: <Hammer />, cls: "bg-info-soft text-info" },
  order_ready: { icon: <PackageCheck />, cls: "bg-warning-soft text-warning" },
  order_completed: { icon: <CircleCheck />, cls: "bg-success-soft text-success" },
  review_received: { icon: <Star />, cls: "bg-accent-soft text-accent-strong" },
};

export function ActivityItem({ n, compact }: { n: Notification; compact?: boolean }) {
  const meta = ICONS[n.kind] ?? { icon: <Bell />, cls: "bg-cream text-muted" };
  const unread = !n.read_at;
  const body = (
    <div className={cn("flex gap-4", compact ? "py-3" : "p-4 sm:p-5")}>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-[1.1rem]", meta.cls)} aria-hidden>
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug text-ink", unread ? "font-semibold" : "font-medium")}>{n.title}</p>
        {n.body && !compact ? <p className="mt-1 text-sm leading-relaxed text-muted">{n.body}</p> : null}
        <p className="mt-1 text-xs text-muted">{timeAgo(n.created_at)}</p>
      </div>
      {unread ? (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" role="img" />
      ) : null}
    </div>
  );
  return n.link ? (
    <Link href={n.link} className={cn("block transition", compact ? "rounded-xl hover:bg-cream/50" : "hover:bg-cream/40")}>
      {body}
    </Link>
  ) : (
    body
  );
}
