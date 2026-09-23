import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-5xl text-ink">Privacy</h1>
      <p className="mt-4 text-sm text-muted">Summary version — the full policy will be published before launch.</p>
      <ul className="mt-10 space-y-6 leading-relaxed text-muted">
        <li>
          <strong className="text-ink">Your email stays private.</strong> Other members see your name, city and — for
          tailors — your specialties and reviews. Never your email address.
        </li>
        <li>
          <strong className="text-ink">Offers are blind.</strong> An offer is visible only to the tailor who made it and
          the customer who received it.
        </li>
        <li>
          <strong className="text-ink">Reference images are private.</strong> They can be seen by you and by tailors
          viewing your open request — never by the wider internet.
        </li>
        <li>
          <strong className="text-ink">Chats belong to orders.</strong> Only the customer and tailor on an order can read
          or send its messages.
        </li>
        <li>
          <strong className="text-ink">AI assistance.</strong> If you ask for a description suggestion, your reference
          image is sent securely to our AI provider to generate it. It is not used for anything else by MyTailor.
        </li>
      </ul>
    </article>
  );
}
