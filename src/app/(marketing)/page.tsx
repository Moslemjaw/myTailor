import Link from "next/link";
import { ArrowRight, Check, EyeOff, Lock, MessageSquare, Sparkles, Star, Tag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GarmentIcon } from "@/components/ui/garment-icon";
import { OfferPreview } from "@/components/marketing/offer-preview";

const STEPS = [
  { icon: <Sparkles />, title: "Describe it", text: "Add a title, a photo and a date. AI can help with the words." },
  { icon: <Tag />, title: "Compare offers", text: "Tailors reply with a price, timing and a note." },
  { icon: <MessageSquare />, title: "Work together", text: "Choose one. Chat privately and follow progress." },
];

const GARMENTS = ["suit", "dress", "traditional", "shirt", "trousers", "outerwear", "alteration"];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 pt-16 pb-24 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-24 lg:pb-32">
        <div>
          <h1 className="font-display text-[3rem] leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.5rem]">
            Describe what you need.
            <span className="block text-muted">Tailors make offers.</span>
            <span className="block">You choose.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-charcoal/80">Custom clothing from skilled tailors — without calling around.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup?role=customer" size="lg" icon={<ArrowRight className="order-last size-4" />}>
              Create a request
            </ButtonLink>
            <ButtonLink href="/signup?role=tailor" size="lg" variant="secondary">
              I’m a tailor
            </ButtonLink>
          </div>
          <ul className="mt-12 flex items-center gap-5 text-stone" aria-label="Garments you can request">
            {GARMENTS.map((g) => (
              <li key={g}>
                <GarmentIcon type={g} className="size-6" />
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] border border-line bg-cream" aria-hidden />
          <OfferPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8">
          <h2 className="max-w-md font-display text-4xl leading-tight text-ink">One request. Several offers. Your choice.</h2>
          <ol className="mt-14 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-ivory text-charcoal [&_svg]:size-[1.1rem] [&_svg]:stroke-[1.5]">
                    {s.icon}
                  </span>
                  <span className="text-sm text-muted tabular-nums">0{i + 1}</span>
                </div>
                <p className="mt-5 font-semibold text-ink">{s.title}</p>
                <p className="mt-1.5 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Two audiences */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-24 md:grid-cols-2 md:px-8">
          <Audience
            label="For customers"
            title="Get it made, your way."
            points={["Post once, hear from many tailors", "Compare price, timing and reviews", "Private chat for every order"]}
            href="/signup?role=customer"
            cta="Create a request"
          />
          <Audience
            label="For tailors"
            title="Customers who know what they want."
            points={["Clear briefs with photos and dates", "Blind offers — price on your value", "Build reviews with every order"]}
            href="/signup?role=tailor"
            cta="Join as a tailor"
            dark
          />
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:grid-cols-3 md:px-8">
          <Principle icon={<EyeOff />} title="Blind offers">Tailors never see each other’s prices.</Principle>
          <Principle icon={<Lock />} title="Private by default">Chat opens only between you and your tailor.</Principle>
          <Principle icon={<Star />} title="Honest reviews">Only from completed orders, once each.</Principle>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-ink text-ivory">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-center md:px-8">
          <h2 className="max-w-lg font-display text-4xl leading-tight">Your next garment starts with a few sentences.</h2>
          <Link
            href="/signup"
            className="inline-flex h-13 shrink-0 items-center gap-2 rounded-full bg-ivory px-7 text-[0.95rem] font-semibold text-ink transition hover:bg-white"
          >
            Get started <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}

function Audience({
  label,
  title,
  points,
  href,
  cta,
  dark,
}: {
  label: string;
  title: string;
  points: string[];
  href: string;
  cta: string;
  dark?: boolean;
}) {
  return (
    <div className={dark ? "rounded-[var(--radius-card)] bg-ink p-8 text-ivory md:p-10" : "rounded-[var(--radius-card)] border border-line bg-paper p-8 md:p-10"}>
      <p className={dark ? "text-sm text-ivory/70" : "text-sm text-muted"}>{label}</p>
      <h3 className="mt-2 font-display text-3xl leading-tight">{title}</h3>
      <ul className="mt-8 space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[0.95rem]">
            <Check className={dark ? "size-4 text-ivory/70" : "size-4 text-accent"} aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={
          dark
            ? "mt-10 inline-flex h-11 items-center gap-2 rounded-full bg-ivory px-5 text-sm font-semibold text-ink transition hover:bg-white"
            : "mt-10 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-ivory transition hover:bg-charcoal"
        }
      >
        {cta} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function Principle({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 text-charcoal [&_svg]:size-5 [&_svg]:stroke-[1.5]">{icon}</span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
    </div>
  );
}
