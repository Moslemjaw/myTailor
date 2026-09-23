import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/how-it-works#customers", label: "For customers" },
      { href: "/for-tailors", label: "For tailors" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signup?role=customer", label: "Create a request" },
      { href: "/signup?role=tailor", label: "Join as a tailor" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
            A marketplace for custom clothing. Describe what you need, compare offers from skilled tailors and work
            with the one you choose.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/80 transition hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted md:flex-row md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} MyTailor. Made to measure.</p>
          <p>Prices shown in Kuwaiti dinar (KD).</p>
        </div>
      </div>
    </footer>
  );
}
