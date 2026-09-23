import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** A single "needs you" item: icon, what happened, what to do. */
export function AttentionRow({
  href,
  icon,
  title,
  detail,
  action,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-ivory sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong [&_svg]:size-[1.1rem]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{title}</p>
          <p className="truncate text-sm text-muted">{detail}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink sm:inline-flex">
          {action}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
        <ArrowRight className="size-4 shrink-0 text-stone sm:hidden" aria-hidden />
      </Link>
    </li>
  );
}
