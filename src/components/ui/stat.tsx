import Link from "next/link";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <>
      <p className={cn("font-display text-4xl leading-none", highlight && value > 0 ? "text-accent" : "text-ink")}>{value}</p>
      <p className="mt-2 text-[0.8rem] leading-snug font-medium text-muted">{label}</p>
    </>
  );
  const cls = "rounded-2xl border border-line bg-paper p-4 sm:p-5 transition";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-stone hover:shadow-soft")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
