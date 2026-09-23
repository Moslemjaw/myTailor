import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, EyeOff, History, Inbox, Star, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { BRAND_IMAGES } from "@/lib/brand-images";

export const metadata: Metadata = {
  title: "For tailors",
  description: "Find customers who already know what they want. Send blind offers and grow your reputation on MyTailor.",
};

export default function ForTailorsPage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pt-12 pb-20 md:px-8 lg:grid-cols-2 lg:gap-16 lg:pt-20">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">For tailors</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] text-ink md:text-7xl">
            Spend your time on the craft, not the chase.
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted">
            MyTailor brings you customers with a clear brief, a reference photo and a date. You decide which requests
            fit your skills and what they’re worth.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup?role=tailor" size="lg" icon={<ArrowRight className="order-last size-4" />}>
              Join as a tailor
            </ButtonLink>
            <ButtonLink href="/how-it-works#tailors" size="lg" variant="secondary">
              See the tailor journey
            </ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-cream">
            <Image src={BRAND_IMAGES.shearsOnWool.src} alt={BRAND_IMAGES.shearsOnWool.alt} fill priority sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
          </div>
          <div className="relative mt-16 aspect-[3/4] overflow-hidden rounded-3xl bg-cream">
            <Image src={BRAND_IMAGES.swatches.src} alt={BRAND_IMAGES.swatches.alt} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-x-12 gap-y-14 px-5 py-20 md:grid-cols-3 md:px-8 md:py-24">
          {[
            [<Inbox key="i" />, "Requests with a real brief", "Title, garment type, description, reference image and a desired date — everything you need to price properly."],
            [<EyeOff key="e" />, "Blind, fair competition", "You see how many offers a request has, never what other tailors offered. Price on your value, not theirs."],
            [<History key="h" />, "Revise while it’s open", "Update your price, timing or note until the customer decides. Every version is kept on your record."],
            [<Clock key="c" />, "Your timing, stated upfront", "Offer the turnaround you can actually deliver. Customers see it right next to your price."],
            [<TrendingUp key="t" />, "Clear order stages", "Accepted → In progress → Ready → Completed. Your customer is kept up to date automatically."],
            [<Star key="s" />, "A reputation that travels", "Reviews from completed orders appear with every offer you send."],
          ].map(([icon, title, text]) => (
            <div key={title as string}>
              <span className="flex size-11 items-center justify-center rounded-full bg-cream text-accent [&_svg]:size-5">{icon}</span>
              <p className="mt-5 text-lg font-semibold text-ink">{title}</p>
              <p className="mt-2 leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-12 rounded-[2rem] bg-ink p-8 text-ivory md:p-14 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">Ready when your customers are.</h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ivory/70">
              Set up your profile in a couple of minutes, then start browsing open requests.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Link
              href="/signup?role=tailor"
              className="inline-flex h-13 items-center gap-2 rounded-full bg-ivory px-7 font-semibold text-ink transition hover:bg-white"
            >
              Create a tailor account <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
