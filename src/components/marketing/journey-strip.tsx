import { cn } from "@/lib/cn";

const STEPS = [
  { label: "Request", text: "Describe the garment, add a reference." },
  { label: "Offers", text: "Tailors reply with price, timing and a note." },
  { label: "Selection", text: "Compare and choose one tailor." },
  { label: "Order", text: "Your request becomes a private order." },
  { label: "Chat", text: "Discuss measurements and fabric." },
  { label: "Completion", text: "Follow progress to the final fitting." },
  { label: "Review", text: "Share how it went." },
];

export function JourneyStrip({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <ol className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-7">
      {STEPS.map((s, i) => (
        <li key={s.label} className="relative">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                dark ? "border-ivory/25 text-ivory" : "border-ink/15 text-ink",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {i < STEPS.length - 1 ? (
              <span className={cn("hidden h-px flex-1 lg:block", dark ? "bg-ivory/15" : "bg-line")} aria-hidden />
            ) : null}
          </div>
          <p className={cn("mt-4 font-display text-2xl", dark ? "text-ivory" : "text-ink")}>{s.label}</p>
          <p className={cn("mt-1 text-sm leading-relaxed", dark ? "text-ivory/65" : "text-muted")}>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
