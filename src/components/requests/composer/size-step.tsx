"use client";

import { Lock, Ruler } from "lucide-react";
import { FieldError } from "@/components/ui/field";
import { MEASUREMENTS, SIZES, garmentLabel, measurementsFor } from "@/lib/constants";
import { cn } from "@/lib/cn";

/**
 * Optional size + measurements. Size is part of the public brief; the
 * measurements are stored separately and only shared with the chosen tailor.
 */
export function SizeStep({
  garment,
  size,
  measurements,
  errors,
  onSize,
  onMeasurement,
}: {
  garment: string;
  size: string;
  measurements: Record<string, string>;
  errors: Record<string, string>;
  onSize: (size: string) => void;
  onMeasurement: (key: string, value: string) => void;
}) {
  const keys = measurementsFor(garment);

  return (
    <div className="space-y-10">
      {/* Size */}
      <fieldset>
        <legend className="text-sm font-medium text-ink">Your usual size</legend>
        <p className="mt-1 text-sm text-muted">Helps tailors estimate fabric and price.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const selected = size === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={selected}
                onClick={() => onSize(selected ? "" : s)}
                className={cn(
                  "flex h-11 min-w-14 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                  selected ? "border-ink bg-ink text-ivory" : "border-field bg-paper text-ink hover:border-ink",
                )}
              >
                {s}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={!size}
            onClick={() => onSize("")}
            className={cn(
              "flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
              !size ? "border-ink bg-cream text-ink" : "border-field bg-paper text-muted hover:border-ink hover:text-ink",
            )}
          >
            Not sure
          </button>
        </div>
        <FieldError id="size-error">{errors.size}</FieldError>
      </fieldset>

      {/* Measurements */}
      <fieldset>
        <legend className="text-sm font-medium text-ink">
          Measurements <span className="font-normal text-muted">· optional, in cm</span>
        </legend>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">The ones that matter for {garmentLabel(garment).toLowerCase()}. Fill in what you know.</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-charcoal">
            <Lock className="size-3.5" aria-hidden /> Only shared with the tailor you choose
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {keys.map((k) => {
            const id = `m_${k}`;
            const err = errors[id];
            return (
              <div key={k}>
                <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
                  {MEASUREMENTS[k].label}
                </label>
                <div className="relative">
                  <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    value={measurements[k] ?? ""}
                    onChange={(e) => onMeasurement(k, e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
                    placeholder="—"
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? `${id}-error` : undefined}
                    className="h-12 w-full rounded-xl border border-field bg-paper pr-11 pl-4 text-[0.95rem] text-ink transition-[border-color,box-shadow] hover:border-stone focus:border-ink focus:ring-[3px] focus:ring-ink/10 focus:outline-none aria-[invalid=true]:border-danger"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted" aria-hidden>
                    cm
                  </span>
                </div>
                <FieldError id={`${id}-error`}>{err}</FieldError>
              </div>
            );
          })}
        </div>

        <details className="group mt-6 rounded-xl border border-line bg-paper">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-ink">
            <Ruler className="size-4 text-muted" aria-hidden />
            How to measure
            <span className="ml-auto text-muted transition group-open:rotate-90" aria-hidden>
              ›
            </span>
          </summary>
          <dl className="grid gap-x-6 gap-y-3 border-t border-line px-4 py-4 sm:grid-cols-2">
            {keys.map((k) => (
              <div key={k}>
                <dt className="text-sm font-medium text-ink">{MEASUREMENTS[k].label}</dt>
                <dd className="text-sm text-muted">{MEASUREMENTS[k].tip}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">Use a soft tape, keep it snug but not tight. Your tailor can confirm at the fitting.</p>
        </details>
      </fieldset>
    </div>
  );
}
