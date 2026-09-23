"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { advanceOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { NEXT_ORDER_ACTION, ORDER_STATUS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

/** Tailor-only: exactly one next step is ever offered — no skipping. */
export function StatusAdvancer({ orderId, status, customerName }: { orderId: string; status: OrderStatus; customerName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const next = NEXT_ORDER_ACTION[status];
  if (!next) return null;

  function confirm() {
    setError(null);
    start(async () => {
      const res = await advanceOrder(orderId, next!.to);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
        return;
      }
      setOpen(false);
      toast.success(res.message ?? "Order updated.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-ink p-5 text-ivory sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-accent-soft uppercase">Your next step</p>
        <p className="mt-1.5 text-sm text-ivory/75">{next.hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ivory px-5 text-sm font-semibold text-ink transition hover:bg-white"
      >
        {next.label} <ArrowRight className="size-4" aria-hidden />
      </button>

      <Dialog
        open={open}
        onClose={() => (pending ? null : setOpen(false))}
        dismissible={!pending}
        size="sm"
        title={`${next.label}?`}
        description={`${ORDER_STATUS[status].label} → ${ORDER_STATUS[next.to].label}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={confirm} loading={pending} loadingText="Updating…">
              {next.label}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/85">{next.confirm.replace("your customer", customerName)}</p>
        <p className="mt-3 text-xs text-muted">Orders move forward one stage at a time and can’t be moved back.</p>
        {error ? <Notice tone="danger" className="mt-4" live>{error}</Notice> : null}
      </Dialog>
    </div>
  );
}
