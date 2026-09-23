import { Lock } from "lucide-react";
import { MEASUREMENTS, type MeasurementKey } from "@/lib/constants";
import type { Measurements } from "@/lib/types";

/** Size + measurements as a compact grid (only for people allowed to see them). */
export function MeasurementSummary({
  size,
  measurements,
  note,
}: {
  size: string | null;
  measurements: Measurements | null;
  note?: string;
}) {
  const entries = Object.entries(measurements ?? {}).filter(([k, v]) => k in MEASUREMENTS && typeof v === "number");
  if (!size && !entries.length) return <p className="text-sm text-muted">No size or measurements given.</p>;

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {size ? (
          <div>
            <dt className="text-[0.8rem] text-muted">Size</dt>
            <dd className="mt-0.5 text-[0.95rem] font-medium text-ink">{size}</dd>
          </div>
        ) : null}
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.8rem] text-muted">{MEASUREMENTS[k as MeasurementKey].label}</dt>
            <dd className="mt-0.5 text-[0.95rem] font-medium text-ink tabular-nums">{v} cm</dd>
          </div>
        ))}
      </dl>
      {note && entries.length ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
          <Lock className="size-3.5" aria-hidden /> {note}
        </p>
      ) : null}
    </div>
  );
}
