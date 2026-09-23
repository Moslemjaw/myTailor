import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { BRAND_IMAGES } from "@/lib/brand-images";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Logo />
        <main id="main" className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-md animate-fade-up">{children}</div>
        </main>
        <p className="text-xs text-muted">© {new Date().getFullYear()} MyTailor</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-charcoal lg:block">
        <Image
          src={BRAND_IMAGES.shearsOnWool.src}
          alt={BRAND_IMAGES.shearsOnWool.alt}
          fill
          priority
          sizes="45vw"
          className="object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" aria-hidden />
        <blockquote className="absolute inset-x-12 bottom-12 text-ivory">
          <p className="font-display text-4xl leading-tight">“I know what I want. Now I know who can make it.”</p>
          <footer className="mt-4 text-sm text-ivory/70">Request → Offers → Selection → Order → Review</footer>
        </blockquote>
      </aside>
    </div>
  );
}
