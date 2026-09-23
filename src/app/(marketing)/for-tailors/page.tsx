import type { Metadata } from "next";
import { ArrowRight, EyeOff, History, Inbox, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For tailors",
  description: "Find customers who already know what they want. Send blind offers and grow your reputation on MyTailor.",
};

const FEATURES = [
  { icon: <Inbox />, title: "Clear briefs", text: "Every request has a description, a date and often a photo." },
  { icon: <EyeOff />, title: "Blind offers", text: "No one sees your price. Compete on value, not undercutting." },
  { icon: <History />, title: "Revise anytime", text: "Update your offer until the customer decides." },
  { icon: <Star />, title: "Build a reputation", text: "Reviews from finished orders appear with your offers." },
];

export default function ForTailorsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 md:px-8 md:pt-24">
        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] text-ink md:text-6xl">Spend your time on the craft, not the chase.</h1>
        <p className="mt-5 max-w-lg text-lg text-muted">Customers post what they need. You decide what to take on and what it’s worth.</p>
        <ButtonLink href="/signup?role=tailor" size="lg" className="mt-10" icon={<ArrowRight className="order-last size-4" />}>
          Join as a tailor
        </ButtonLink>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-cream text-charcoal [&_svg]:size-[1.1rem] [&_svg]:stroke-[1.5]">
                {f.icon}
              </span>
              <p className="mt-5 font-semibold text-ink">{f.title}</p>
              <p className="mt-1.5 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
