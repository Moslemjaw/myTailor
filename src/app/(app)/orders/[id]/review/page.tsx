import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, ShieldAlert } from "lucide-react";
import { OrderProgress } from "@/components/orders/order-progress";
import { RequestImage } from "@/components/requests/request-image";
import { ReviewForm } from "@/components/reviews/review-form";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { BackLink } from "@/components/ui/nav-bits";
import { Stars } from "@/components/ui/stars";
import { requireViewer } from "@/lib/auth";
import { formatDate, formatDays, formatPrice, orderRef } from "@/lib/format";
import { signImagePath } from "@/lib/images";
import { getOrderDetail } from "@/lib/queries";

export const metadata: Metadata = { title: "Leave a review" };

export default async function ReviewPage({ params }: PageProps<"/orders/[id]/review">) {
  const { id } = await params;
  const viewer = await requireViewer();
  const detail = await getOrderDetail(id);
  if (!detail) notFound();
  const { order, request, review } = detail;
  const imageUrl = await signImagePath(request?.image_path);
  const tailorName = order.tailor?.full_name ?? "your tailor";

  let body: React.ReactNode;
  if (viewer.id !== order.customer_id) {
    body = (
      <EmptyState
        icon={<ShieldAlert />}
        title="Review unavailable"
        description="Only the customer who placed this order can review it."
        action={<ButtonLink href={`/orders/${id}`} variant="secondary">Back to order</ButtonLink>}
      />
    );
  } else if (review) {
    body = (
      <div>
        <p className="eyebrow">Already reviewed</p>
        <h2 className="mt-3 font-display text-4xl text-ink">You’ve already reviewed this order</h2>
        <div className="mt-6 rounded-2xl bg-ivory p-5">
          <Stars value={review.rating} size="md" />
          {review.comment ? <p className="mt-3 leading-relaxed text-ink/85">“{review.comment}”</p> : null}
          <p className="mt-3 text-xs text-muted">Published {formatDate(review.created_at)}</p>
        </div>
        <p className="mt-4 text-sm text-muted">Each order can be reviewed once.</p>
        <ButtonLink href={`/orders/${id}`} variant="secondary" className="mt-6">
          Back to order
        </ButtonLink>
      </div>
    );
  } else if (order.status !== "completed") {
    body = (
      <div>
        <EmptyState
          icon={<Clock />}
          title="You can review this order after it is completed."
          description={`${tailorName} will mark the order as completed once you have your garment. We’ll remind you then.`}
          action={<ButtonLink href={`/orders/${id}`} variant="secondary">Back to order</ButtonLink>}
        />
        <div className="mt-8">
          <OrderProgress status={order.status} />
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <h2 className="font-display text-4xl leading-tight text-ink">How was working with {tailorName}?</h2>
        <p className="mt-2 mb-8 text-muted">Your review helps other customers choose, and helps tailors grow.</p>
        <ReviewForm orderId={id} tailorName={tailorName} />
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        <BackLink href={`/orders/${id}`}>Order {orderRef(order.order_number)}</BackLink>
      </div>
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[18rem_1fr]">
        <aside>
          <Card className="overflow-hidden">
            <RequestImage url={imageUrl} alt="" className="aspect-[4/3] w-full" iconClassName="size-8" />
            <div className="p-5">
              <p className="text-xs font-semibold text-muted">Order {orderRef(order.order_number)}</p>
              <p className="mt-1 font-semibold text-ink">{request?.title}</p>
              <p className="mt-1 text-sm text-muted">
                {formatPrice(order.price)} · {formatDays(order.turnaround_days)}
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={order.tailor?.full_name} seed={order.tailor_id} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{order.tailor?.full_name}</p>
                  <p className="text-xs text-muted">{order.completed_at ? `Completed ${formatDate(order.completed_at, { year: undefined })}` : "Your tailor"}</p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
        <Card className="p-6 sm:p-8">{body}</Card>
      </div>
    </>
  );
}
