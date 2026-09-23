import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palette = ["bg-[#e9dfd0]", "bg-[#dfe3da]", "bg-[#e6dad8]", "bg-[#dcdfe4]", "bg-[#ece2cf]"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "size-8 text-[0.7rem]",
    md: "size-10 text-xs",
    lg: "size-14 text-base",
    xl: "size-20 text-xl",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-charcoal ring-1 ring-ink/5",
        palette[hash(seed ?? name ?? "") % palette.length],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
