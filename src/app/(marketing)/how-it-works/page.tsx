import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description: "How MyTailor connects customers who need custom clothing with skilled independent tailors.",
};

const CUSTOMER = [
  ["Create a request", "Title, garment type, a reference photo and your date."],
  ["Compare offers", "Price, turnaround, a note and reviews from each tailor."],
  ["Choose one tailor", "Your request closes and becomes a private order."],
  ["Chat and follow progress", "Accepted → In progress → Ready → Completed."],
  ["Leave a review", "Once it’s done, tell others how it went."],
];

const TAILOR = [
  ["Set up your profile", "Specialties and experience appear with every offer."],
  ["Browse open requests", "Clear briefs, photos and dates."],
  ["Send an offer", "Your price, timing and approach. Revise it while it’s open."],
  ["Get selected", "The order and a private chat open."],
  ["Deliver", "Move the order forward one stage at a time."],
];

const FAQ = [
  ["Can tailors see each other’s offers?", "No. A tailor only sees their own offer and how many offers a request has."],
  ["When can I talk to a tailor?", "As soon as you accept their offer. The chat belongs to that order only."],
  ["Does the AI write my request?", "It only suggests. You edit, use or ignore it."],
  ["How do payments work?", "You settle the agreed price directly with your tailor."],
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-16 md:px-8 md:pt-24">
        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] text-ink md:text-6xl">How MyTailor works</h1>
        <p className="mt-5 max-w-lg text-lg text-muted">Customers post what they need. Tailors make offers. Customers choose.</p>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 py-20 md:grid-cols-2 md:px-8">
          <Journey id="customers" title="For customers" steps={CUSTOMER} href="/signup?role=customer" cta="Create a request" />
          <Journey id="tailors" title="For tailors" steps={TAILOR} href="/signup?role=tailor" cta="Join as a tailor" />
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
          <h2 className="text-xl font-semibold text-ink">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium text-ink">
                  {q}
                  <span className="text-xl font-light text-muted transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Journey({ id, title, steps, href, cta }: { id: string; title: string; steps: string[][]; href: string; cta: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <ol className="mt-8 space-y-6">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold text-muted">{i + 1}</span>
            <div>
              <p className="font-medium text-ink">{t}</p>
              <p className="mt-0.5 text-sm text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <ButtonLink href={href} variant="secondary" className="mt-10" icon={<ArrowRight className="order-last size-4" />}>
        {cta}
      </ButtonLink>
    </div>
  );
}
