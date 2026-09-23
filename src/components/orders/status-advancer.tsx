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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{next.hint}</p>
      <Button onClick={() => setOpen(true)} icon={<ArrowRight className="order-last size-4" />}>
        {next.label}
      </Button>

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
        <p className="mt-3 text-xs text-muted">Orders move forward one stage at a time.</p>
        {error ? <Notice tone="danger" className="mt-4" live>{error}</Notice> : null}
      </Dialog>
    </div>
  );
}
