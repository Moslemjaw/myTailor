import Image from "next/image";
import Link from "next/link";
import { ArrowRight, EyeOff, Lock, MessageSquare, Sparkles, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { JourneyStrip } from "@/components/marketing/journey-strip";
import { OfferPreview } from "@/components/marketing/offer-preview";
import { BRAND_IMAGES } from "@/lib/brand-images";

const CATEGORIES = [
  { title: "Suits & tailoring", image: BRAND_IMAGES.suitDetail, text: "Three-piece, wedding, everyday." },
  { title: "Evening wear", image: BRAND_IMAGES.eveningDress, text: "Gowns and dresses cut to you." },
  { title: "Traditional wear", image: BRAND_IMAGES.traditional, text: "Abayas, dishdashas, bishts." },
  { title: "Alterations", image: BRAND_IMAGES.handStitch, text: "Make what you own fit perfectly." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-10 pb-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16 lg:pb-24">
          <div className="flex flex-col justify-center">
            <p className="eyebrow animate-fade-up">A marketplace for custom clothing</p>
            <h1 className="mt-6 animate-fade-up font-display text-[3.1rem] leading-[0.98] tracking-tight text-ink [animation-delay:60ms] sm:text-7xl lg:text-[5.4rem]">
              Describe what you need.
              <span className="block text-muted italic">Get offers from skilled tailors.</span>
              <span className="block">Choose the one that’s right for you.</span>
            </h1>
            <p className="mt-7 max-w-lg animate-fade-up text-[1.05rem] leading-relaxed text-muted [animation-delay:120ms]">
              Post one request instead of calling around. Tailors reply with their price, timing and approach — you
              compare, choose, and work together privately until it’s finished.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:180ms] sm:flex-row">
              <ButtonLink href="/signup?role=customer" size="lg" icon={<ArrowRight className="size-4 order-last" />}>
                Create a request
              </ButtonLink>
              <ButtonLink href="/signup?role=tailor" size="lg" variant="secondary">
                I’m a tailor
              </ButtonLink>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                ["1", "request, many tailors"],
                ["Blind", "offers, fair prices"],
                ["Private", "chat per order"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="sr-only">{v}</dt>
                  <dd>
                    <span className="block font-display text-3xl text-ink">{k}</span>
                    <span className="mt-1 block text-xs leading-snug text-muted">{v}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-cream sm:aspect-[5/6] lg:aspect-[4/5]">
              <Image
                src={BRAND_IMAGES.heroCutting.src}
                alt={BRAND_IMAGES.heroCutting.alt}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" aria-hidden />
              <p className="absolute bottom-6 left-6 max-w-[14rem] text-sm font-medium text-ivory/90">
                Every order starts with one clear request.
              </p>
            </div>
            <OfferPreview className="absolute -bottom-10 -left-4 hidden w-[19rem] sm:block lg:-left-16" />
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">How MyTailor works</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
                From a description to a finished garment — in one place.
              </h2>
            </div>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent">
              See the full journey <ArrowRight className="size-4" />
            </Link>
          </div>
          <JourneyStrip />
        </div>
      </section>

      {/* Customers */}
      <section id="customers" className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">For customers</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
              Say it once. Let the right tailors come to you.
            </h2>
            <ul className="mt-10 space-y-8">
              <Feature icon={<Sparkles />} title="A description that starts itself">
                Upload a reference photo and our assistant drafts a description of the style. You edit it, keep it or
                ignore it — the request is always yours.
              </Feature>
              <Feature icon={<Star />} title="Compare offers side by side">
                Price, turnaround, a personal note and each tailor’s reviews. No spreadsheets, no chasing replies.
              </Feature>
              <Feature icon={<MessageSquare />} title="One private conversation per order">
                Once you choose, a chat opens just for that order — measurements, fabric and fittings stay together.
              </Feature>
            </ul>
            <ButtonLink href="/signup?role=customer" className="mt-10" icon={<ArrowRight className="order-last size-4" />}>
              Start your first request
            </ButtonLink>
          </div>
          <div className="order-1 grid grid-cols-5 gap-4 lg:order-2">
            <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-3xl bg-cream">
              <Image src={BRAND_IMAGES.eveningDress.src} alt={BRAND_IMAGES.eveningDress.alt} fill sizes="(min-width:1024px) 28vw, 60vw" className="object-cover" />
            </div>
            <div className="col-span-2 flex flex-col gap-4 pt-12">
              <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream">
                <Image src={BRAND_IMAGES.satinAndTape.src} alt={BRAND_IMAGES.satinAndTape.alt} fill sizes="(min-width:1024px) 18vw, 40vw" className="object-cover" />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-cream">
                <Image src={BRAND_IMAGES.sketches.src} alt={BRAND_IMAGES.sketches.alt} fill sizes="(min-width:1024px) 18vw, 40vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tailors */}
      <section className="bg-ink text-ivory">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image src={BRAND_IMAGES.studio.src} alt={BRAND_IMAGES.studio.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover opacity-90" />
          </div>
          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-ivory/60 uppercase">For tailors</p>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              Customers who already know what they want.
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-ivory/70">
              Browse open requests with a clear brief, reference photo and deadline. Send your price and timing,
              revise it while the request is open, and build your reputation one finished order at a time.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                ["Blind offers", "Competitors never see your price, timing or note — and you never see theirs."],
                ["Revise freely", "Adjust your offer as long as the request is open. Every version is kept."],
                ["Clear progress", "Move each order from accepted to completed, one step at a time."],
                ["Earn reviews", "Customers review finished work, building a record that speaks for you."],
              ].map(([t, d]) => (
                <div key={t} className="border-t border-ivory/15 pt-4">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/60">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup?role=tailor"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-ivory px-7 text-[0.95rem] font-semibold text-ink transition hover:bg-white"
              >
                Join as a tailor <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/for-tailors"
                className="inline-flex h-13 items-center justify-center rounded-full border border-ivory/25 px-7 text-[0.95rem] font-semibold text-ivory transition hover:border-ivory/60"
              >
                How it works for tailors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow">What people make</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">Made to measure, whatever the occasion.</h2>
        </div>
        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {CATEGORIES.map((c) => (
            <figure key={c.title} className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-auto">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-cream">
                <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width:768px) 25vw, 72vw" className="object-cover transition duration-700 hover:scale-[1.03]" />
              </div>
              <figcaption className="mt-4">
                <p className="font-semibold text-ink">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-line bg-cream/50">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="eyebrow">Private by design</p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-ink">Fair for tailors. Clear for customers.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <Principle icon={<EyeOff />} title="Blind offers">
                Each offer is seen only by the tailor who wrote it and the customer who asked.
              </Principle>
              <Principle icon={<Lock />} title="Chat after choosing">
                Private conversation opens only once an offer is accepted — and only for those two people.
              </Principle>
              <Principle icon={<Star />} title="Honest reviews">
                Only the customer of a completed order can review it, and only once.
              </Principle>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-charcoal">
          <Image src={BRAND_IMAGES.swatchBook.src} alt="" fill sizes="100vw" className="object-cover opacity-30" />
          <div className="relative px-6 py-16 text-center md:px-16 md:py-24">
            <h2 className="mx-auto max-w-3xl font-display text-4xl leading-tight text-ivory md:text-6xl">
              Your next garment starts with a few sentences.
            </h2>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup?role=customer"
                className="inline-flex h-13 items-center justify-center rounded-full bg-ivory px-7 font-semibold text-ink transition hover:bg-white"
              >
                Create a request
              </Link>
              <Link
                href="/signup?role=tailor"
                className="inline-flex h-13 items-center justify-center rounded-full border border-ivory/30 px-7 font-semibold text-ivory transition hover:border-ivory/70"
              >
                Join as a tailor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-accent [&_svg]:size-[1.1rem]">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1.5 leading-relaxed text-muted">{children}</p>
      </div>
    </li>
  );
}

function Principle({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="flex size-10 items-center justify-center rounded-full bg-paper text-ink ring-1 ring-line [&_svg]:size-4">{icon}</span>
      <p className="mt-5 font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
