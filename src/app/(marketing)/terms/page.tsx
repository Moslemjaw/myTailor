import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-5xl text-ink">Terms of use</h1>
      <p className="mt-4 text-sm text-muted">Summary version — the full terms will be published before launch.</p>
      <div className="mt-10 space-y-8 leading-relaxed text-ink/85">
        <Section title="What MyTailor does">
          MyTailor connects customers who want custom clothing with independent tailors. Tailors are not employed by
          MyTailor; each order is an agreement between the customer and the tailor they choose.
        </Section>
        <Section title="Accounts">
          Each account has one role — customer or tailor — chosen when it is created. Keep your sign-in details
          private and tell us if you think someone else has used your account.
        </Section>
        <Section title="Requests and offers">
          Customers describe what they need honestly. Tailors make offers they intend to honour. When a customer
          accepts an offer, the request closes and an order is created at the agreed price and turnaround.
        </Section>
        <Section title="Payments">
          Payments are arranged directly between customer and tailor. MyTailor does not currently process payments.
        </Section>
        <Section title="Reviews">
          Reviews must reflect a genuine experience of a completed order. We may remove reviews that are abusive or
          unrelated to the order.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-muted">{children}</p>
    </section>
  );
}
