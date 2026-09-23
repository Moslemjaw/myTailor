import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/how-it-works#customers", label: "For customers" },
  { href: "/for-tailors", label: "For tailors" },
];

export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-muted transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {viewer ? (
            <ButtonLink href="/dashboard" size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
        <MobileMenu nav={NAV} signedIn={Boolean(viewer)} />
      </div>
    </header>
  );
}
