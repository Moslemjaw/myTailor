"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Native <dialog> — focus trapping, Escape and inert background for free.
 * Renders as a bottom sheet on small screens and a centred card on larger ones.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-visible bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]",
        "sm:m-auto sm:w-[calc(100%-2rem)]",
        size === "sm" && "sm:max-w-md",
        size === "md" && "sm:max-w-lg",
        size === "lg" && "sm:max-w-2xl",
        "open:animate-fade-up",
      )}
    >
      <div className="flex max-h-[92dvh] flex-col rounded-t-3xl border border-line bg-paper shadow-lift sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2 sm:px-7 sm:pt-7">
          <div>
            <h2 id={titleId} className="font-display text-[1.9rem] leading-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 rounded-full p-2 text-muted transition hover:bg-cream hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>
        {children ? <div className="overflow-y-auto px-6 py-4 sm:px-7">{children}</div> : null}
        {footer ? (
          <div className="pb-safe flex flex-col-reverse gap-3 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
