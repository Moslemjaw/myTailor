import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-5 py-6 md:px-10">
      <Logo />
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-8xl text-sand">404</p>
        <h1 className="mt-4 font-display text-5xl leading-tight text-ink">This page isn’t available</h1>
        <p className="mt-4 leading-relaxed text-muted">
          The link may be broken, or the page may belong to another account.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-ivory hover:bg-charcoal">
            Back to MyTailor
          </Link>
          <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-ink hover:border-stone">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
