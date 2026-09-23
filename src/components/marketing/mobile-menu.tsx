"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function MobileMenu({ nav, signedIn }: { nav: { href: string; label: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-mr-2 rounded-full p-2.5 text-ink hover:bg-cream"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 top-18 bottom-0 z-40 animate-fade-up bg-ivory px-5 pt-6 pb-10">
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-5 font-display text-3xl text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-3">
            {signedIn ? (
              <ButtonLink onClick={() => setOpen(false)} href="/dashboard" size="lg">
                Go to dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink onClick={() => setOpen(false)} href="/signup" size="lg">
                  Get started
                </ButtonLink>
                <ButtonLink onClick={() => setOpen(false)} href="/login" size="lg" variant="secondary">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
