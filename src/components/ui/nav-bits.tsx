import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

/** URL-driven tabs (?tab=…) so filters are linkable and work without JS. */
export function LinkTabs({
  tabs,
  active,
  label,
}: {
  tabs: { key: string; label: string; href: string; count?: number }[];
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 mb-5 overflow-x-auto border-b border-line px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-6">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <li key={t.key}>
              <Link
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition",
                  isActive ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t.label}
                {typeof t.count === "number" ? <span className="text-xs text-muted tabular-nums">{t.count}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
