"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { submitOffer } from "@/actions/offers";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { CURRENCY } from "@/lib/constants";
import type { Offer } from "@/lib/types";

/** Create or revise the current tailor's single offer on a request. */
export function OfferForm({
  requestId,
  existing,
  daysLeft,
  onDone,
  onCancel,
}: {
  requestId: string;
  existing: Offer | null;
  daysLeft: number;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [price, setPrice] = useState(existing ? String(Number(existing.price)) : "");
  const [days, setDays] = useState(existing ? String(existing.turnaround_days) : "");
  const [message, setMessage] = useState(existing?.message ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const unchanged =
    existing &&
    Number(price) === Number(existing.price) &&
    Number(days) === existing.turnaround_days &&
    message.trim() === existing.message.trim();
  const late = Number(days) > 0 && daysLeft >= 0 && Number(days) > daysLeft;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    start(async () => {
      const res = await submitOffer({ requestId, price, turnaroundDays: days, message });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setFormError(res.error);
        if (/no longer accepting/i.test(res.error)) router.refresh();
        return;
      }
      setErrors({});
      toast.success(res.message ?? "Offer saved.");
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError ? <Notice tone="danger" live>{formError}</Notice> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field id="offer-price" label="Your price" error={errors.price}>
          <div className="relative">
            <Input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
              className="pr-12 text-lg font-semibold"
              {...describedBy("offer-price", { error: errors.price })}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted">{CURRENCY}</span>
          </div>
        </Field>
        <Field id="offer-days" label="Turnaround" error={errors.turnaround}>
          <div className="relative">
            <Input
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="pr-14 text-lg font-semibold"
              {...describedBy("offer-days", { error: errors.turnaround })}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted">days</span>
          </div>
        </Field>
      </div>
      {late ? (
        <p className="flex items-start gap-2 text-sm text-warning" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          The customer needs it in {daysLeft} {daysLeft === 1 ? "day" : "days"}. They’ll see that your timing is later than their date.
        </p>
      ) : null}
      <Field
        id="offer-message"
        label="Message to the customer"
        hint="Your approach, fabric, fittings included."
        error={errors.message}
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={1500}
          placeholder="e.g. I can make this in Italian wool with a half-canvas construction. Two fittings included."
          {...describedBy("offer-message", { hint: true, error: errors.message })}
        />
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="lg" className={onCancel ? undefined : "w-full"} loading={pending} loadingText={existing ? "Updating…" : "Sending…"} disabled={Boolean(unchanged)}>
          {existing ? "Update offer" : "Send offer"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted">Only the customer sees your offer. You can revise it while the request is open.</p>
    </form>
  );
}
