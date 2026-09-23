import { MessageSquare, Sparkles, Tag } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GarmentIcon } from "@/components/ui/garment-icon";

const POINTS = [
  { icon: <Sparkles />, title: "Describe what you need", text: "A few sentences and a photo. AI can help." },
  { icon: <Tag />, title: "Compare blind offers", text: "Price, timing and reviews from skilled tailors." },
  { icon: <MessageSquare />, title: "Work together privately", text: "One chat per order, from fitting to finish." },
];

const GARMENTS = ["suit", "dress", "traditional", "shirt", "trousers", "outerwear", "alteration"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 text-ivory lg:flex xl:px-16">
        <Logo tone="ivory" />
        <div className="max-w-md">
          <p className="font-display text-[2.75rem] leading-[1.05]">Custom clothing, made by the right tailor.</p>
          <ul className="mt-12 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ivory/10 text-ivory [&_svg]:size-[1.1rem] [&_svg]:stroke-[1.5]">
                  {p.icon}
                </span>
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="mt-0.5 text-sm text-ivory/70">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ul className="flex gap-5 text-ivory/35" aria-hidden>
          {GARMENTS.map((g) => (
            <li key={g}>
              <GarmentIcon type={g} className="size-6" />
            </li>
          ))}
        </ul>
      </aside>

      {/* Form */}
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[25rem] animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
