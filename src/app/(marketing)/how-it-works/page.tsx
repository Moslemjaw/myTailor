import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { JourneyStrip } from "@/components/marketing/journey-strip";
import { OfferPreview } from "@/components/marketing/offer-preview";
import { BRAND_IMAGES } from "@/lib/brand-images";

export const metadata: Metadata = {
  title: "How it works",
  description: "How MyTailor connects customers who need custom clothing with skilled independent tailors.",
};

const CUSTOMER_STEPS = [
  ["Create your request", "Give it a title, choose the type of garment and add a reference photo if you have one."],
  ["Get a head start from AI", "Our assistant can turn your photo into a suggested description. Edit it, accept it or write your own."],
  ["Set your date", "Tell tailors when you need it. They’ll only offer if they can make it work."],
  ["Receive offers", "Tailors reply with a price, a turnaround and a note about how they’d make it."],
  ["Choose one tailor", "Compare offers and reviews, then choose. The request closes and becomes your order."],
  ["Talk privately", "A chat opens for that order only. Share measurements, fabric choices and fitting times."],
  ["Follow progress", "See each stage — accepted, in progress, ready, completed — as your tailor updates it."],
  ["Leave a review", "Once it’s complete, tell others what it was like to work with your tailor."],
];

const TAILOR_STEPS = [
  ["Create your tailor profile", "Add your specialties and experience so customers know what you do best."],
  ["Browse open requests", "Every request shows the brief, reference photo, desired date and how many offers it has."],
  ["Send your offer", "Set your price, how many days you need, and a short note on your approach."],
  ["Revise while it’s open", "Change your mind? Update your offer until the customer decides. Every version is kept."],
  ["Get selected", "When a customer chooses you, the request becomes an order and your private chat opens."],
  ["Work through the stages", "Start work, mark it ready, then complete it — one clear step at a time."],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-14 pb-16 md:px-8 md:pt-20">
        <p className="eyebrow">How it works</p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.02] text-ink md:text-7xl">
          Customers post what they need. Tailors make offers. Customers choose.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
          MyTailor isn’t a clothing store and it isn’t a general freelance site. It’s built around one thing: getting a
          garment made by the right person, with everything in one place.
        </p>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <JourneyStrip />
        </div>
      </section>

      <section id="customers" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">The customer journey</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
              From “I know what I want” to “it fits perfectly.”
            </h2>
            <OfferPreview className="mt-10 max-w-sm" />
          </div>
          <ol className="space-y-2">
            {CUSTOMER_STEPS.map(([title, text], i) => (
              <Step key={title} n={i + 1} title={title}>
                {text}
              </Step>
            ))}
            <li className="pt-6">
              <ButtonLink href="/signup?role=customer" icon={<ArrowRight className="order-last size-4" />}>
                Create a request
              </ButtonLink>
            </li>
          </ol>
        </div>
      </section>

      <section id="tailors" className="scroll-mt-24 border-t border-line bg-cream/50">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <ol className="order-2 space-y-2 lg:order-1">
            {TAILOR_STEPS.map(([title, text], i) => (
              <Step key={title} n={i + 1} title={title}>
                {text}
              </Step>
            ))}
            <li className="pt-6">
              <ButtonLink href="/signup?role=tailor" icon={<ArrowRight className="order-last size-4" />}>
                Join as a tailor
              </ButtonLink>
            </li>
          </ol>
          <div className="order-1 lg:sticky lg:top-28 lg:order-2 lg:self-start">
            <p className="eyebrow">The tailor journey</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
              Find the work. Make the offer. Do what you do best.
            </h2>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-3xl bg-cream">
              <Image src={BRAND_IMAGES.patternMaking.src} alt={BRAND_IMAGES.patternMaking.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-28">
        <p className="eyebrow text-center">Good to know</p>
        <h2 className="mt-4 text-center font-display text-4xl text-ink">Questions people ask</h2>
        <div className="mt-12 divide-y divide-line border-y border-line">
          {[
            ["Can tailors see each other’s offers?", "No. Offers are blind. A tailor sees their own offer and how many offers a request has — never another tailor’s price, timing or message."],
            ["Can I change my offer?", "Yes, as long as the request is still open. Once the customer chooses a tailor, every offer on that request is frozen."],
            ["When can I talk to a tailor?", "Private chat opens as soon as you accept an offer. It belongs to that order and only the two of you can read it."],
            ["Does the AI write my request for me?", "It only suggests. You decide what goes in your request — edit the suggestion, keep it, or ignore it completely."],
            ["How do payments work?", "You agree the price on MyTailor and settle it directly with your tailor. Online payments aren’t part of MyTailor yet."],
            ["Who can leave a review?", "Only the customer of an order, only after it’s marked completed, and only once."],
          ].map(([q, a]) => (
            <details key={q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold text-ink">
                {q}
                <span className="text-2xl font-light text-muted transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-6 border-b border-line py-7 last:border-0">
      <span className="font-display text-3xl leading-none text-stone">{String(n).padStart(2, "0")}</span>
      <div>
        <p className="text-lg font-semibold text-ink">{title}</p>
        <p className="mt-2 leading-relaxed text-muted">{children}</p>
      </div>
    </li>
  );
}
