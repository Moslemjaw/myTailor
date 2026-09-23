import { Clock, Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Static illustration of the offer-comparison experience for marketing pages. */
const SAMPLE = [
  { name: "Atelier Noor", initials: "AN", price: "75 KD", days: "7 days", rating: "4.9", note: "Silk crepe, fully lined. Two fittings included." },
  { name: "Hassan Tailoring", initials: "HT", price: "90 KD", days: "5 days", rating: "5.0", note: "I'd cut this bias for a softer fall. Ready before your date.", chosen: true },
  { name: "Maison Rawan", initials: "MR", price: "80 KD", days: "6 days", rating: "4.7", note: "Happy to adjust the neckline as in your reference." },
];

export function OfferPreview({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-line bg-paper p-4 shadow-lift sm:p-5", className)} aria-hidden="true">
      <div className="flex items-center justify-between px-1 pb-4">
        <div>
          <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted uppercase">Your request</p>
          <p className="mt-1 font-semibold text-ink">Long black evening dress</p>
        </div>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.7rem] font-semibold text-accent-strong">3 offers</span>
      </div>
      <div className="space-y-2.5">
        {SAMPLE.map((o) => (
          <div
            key={o.name}
            className={cn(
              "rounded-2xl border p-3.5 transition",
              o.chosen ? "border-ink bg-white shadow-soft" : "border-line bg-ivory/60",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-cream text-[0.7rem] font-semibold text-charcoal">
                {o.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{o.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Star className="size-3 fill-accent text-accent" /> {o.rating}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-ink">{o.price}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-muted">
                  <Clock className="size-3" /> {o.days}
                </p>
              </div>
            </div>
            <p className="mt-2.5 line-clamp-1 text-xs text-muted">“{o.note}”</p>
            {o.chosen ? (
              <div className="mt-3 rounded-full bg-ink py-2 text-center text-xs font-semibold text-ivory">Choose this tailor</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
