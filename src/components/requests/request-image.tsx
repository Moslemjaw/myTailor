import { Shirt } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Private reference image (short-lived signed URL) with an elegant fallback.
 * Plain <img> because signed URLs change and are already right-sized uploads.
 */
export function RequestImage({
  url,
  alt,
  className,
  iconClassName,
  priority,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-cream", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 size-full object-cover"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--color-paper),var(--color-cream))]">
          <Shirt className={cn("size-6 text-stone", iconClassName)} strokeWidth={1.4} aria-hidden />
          <span className="sr-only">No reference image</span>
        </div>
      )}
    </div>
  );
}
