import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-tailors", label: "For tailors" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <Logo />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">© {new Date().getFullYear()} MyTailor</p>
      </div>
    </footer>
  );
}
