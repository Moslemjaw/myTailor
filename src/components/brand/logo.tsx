import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark: a needle-and-thread monogram + serif name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M9 22.5V10.2l7 8 7-8v12.3"
        fill="none"
        stroke="var(--color-ivory)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 25.5c5-2.2 13.8-2.2 19 0" fill="none" stroke="var(--color-accent-soft)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.6 1.8" />
    </svg>
  );
}

export function Logo({ href = "/", className, tone = "ink" }: { href?: string; className?: string; tone?: "ink" | "ivory" }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", tone === "ink" ? "text-ink" : "text-ivory", className)}
      aria-label="MyTailor home"
    >
      <LogoMark className={tone === "ivory" ? "text-ivory [&_path:first-of-type]:stroke-ink" : undefined} />
      <span className="font-display text-[1.6rem] leading-none tracking-tight">MyTailor</span>
    </Link>
  );
}
