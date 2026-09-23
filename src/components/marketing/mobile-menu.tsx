"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

/**
 * Full-screen sheet rendered into <body> (not inside the header), so no
 * ancestor style — backdrop-filter, transforms — can ever clip or reposition it.
 */
export function MobileMenu({ nav, signedIn }: { nav: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        className="-mr-2 rounded-full p-2.5 text-ink hover:bg-cream"
      >
        <Menu className="size-5" />
      </button>

      {open
        ? createPortal(
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-0 z-[70] flex flex-col bg-ivory md:hidden"
            >
              <div className="flex h-18 shrink-0 items-center justify-between border-b border-line px-5">
                <Logo />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="-mr-2 rounded-full p-2.5 text-ink hover:bg-cream"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-4">
                <ul className="divide-y divide-line">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={close} className="flex items-center justify-between py-4 text-lg font-medium text-ink">
                        {item.label}
                        <ChevronRight className="size-5 text-stone" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="pb-safe flex shrink-0 flex-col gap-3 border-t border-line bg-paper px-5 pt-5 pb-6">
                {signedIn ? (
                  <ButtonLink onClick={close} href="/dashboard" size="lg">
                    Go to dashboard
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink onClick={close} href="/signup" size="lg">
                      Get started
                    </ButtonLink>
                    <ButtonLink onClick={close} href="/login" size="lg" variant="secondary">
                      Sign in
                    </ButtonLink>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
