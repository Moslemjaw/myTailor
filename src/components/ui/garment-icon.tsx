import { Ruler, Scissors, Shirt } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Minimal line icons for each garment type — drawn to match lucide's
 * 24px grid and 1.5 stroke so they sit naturally beside UI icons.
 */
const PATHS: Record<string, React.ReactNode> = {
  suit: (
    <>
      <path d="M9 3l3 5 3-5" />
      <path d="M9 3 5 5 4 21h8V8" />
      <path d="M15 3l4 2 1 16h-8" />
      <path d="M6.5 15H9" />
    </>
  ),
  dress: (
    <>
      <path d="M9.5 3 10 7M14.5 3 14 7" />
      <path d="M10 7h4l1 5H9z" />
      <path d="M9 12 5 21h14l-4-9" />
    </>
  ),
  trousers: (
    <>
      <path d="M6 3h12l1 18h-5.5L12 9l-1.5 12H5z" />
      <path d="M6.2 6.5h11.6" />
    </>
  ),
  traditional: (
    <>
      <path d="M9 3h6l5 5-2 2-2-2v13H8V8l-2 2-2-2z" />
      <path d="M12 3v5" />
    </>
  ),
  outerwear: (
    <>
      <path d="M9 3l3 4 3-4" />
      <path d="M9 3 5 5 4 22h8V7" />
      <path d="M15 3l4 2 1 17h-8" />
      <path d="M4.6 13h14.8" />
    </>
  ),
};

export function GarmentIcon({ type, className }: { type: string; className?: string }) {
  const cls = cn("size-5", className);
  if (type === "shirt") return <Shirt className={cls} strokeWidth={1.5} aria-hidden />;
  if (type === "alteration") return <Scissors className={cls} strokeWidth={1.5} aria-hidden />;
  const paths = PATHS[type];
  if (!paths) return <Ruler className={cls} strokeWidth={1.5} aria-hidden />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden
    >
      {paths}
    </svg>
  );
}

/** Square tile: the reference photo when there is one, otherwise the garment icon. */
export function GarmentThumb({
  type,
  imageUrl,
  alt = "",
  size = "md",
  className,
}: {
  type: string;
  imageUrl?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-10 rounded-lg", md: "size-12 rounded-xl", lg: "size-16 rounded-xl" };
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-cream text-charcoal", sizes[size], className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="absolute inset-0 size-full object-cover" decoding="async" />
      ) : (
        <GarmentIcon type={type} className={size === "lg" ? "size-6" : "size-5"} />
      )}
    </span>
  );
}
