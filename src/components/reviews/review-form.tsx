"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Star } from "lucide-react";
import { createReview } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Textarea, describedBy } from "@/components/ui/field";
import { cn } from "@/lib/cn";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export function ReviewForm({ orderId, tailorName }: { orderId: string; tailorName: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rating) {
      setRatingError("Choose a star rating.");
      return;
    }
    start(async () => {
      const res = await createReview(orderId, rating, comment);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <div className="py-6 text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-4xl text-ink">Thank you</h2>
        <p className="mt-2 text-muted">Your review for {tailorName} has been published.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/orders/${orderId}`} className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-ivory hover:bg-charcoal">
            Back to order
          </Link>
          <Link href="/requests/new" className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-stone">
            Create another request
          </Link>
        </div>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      {error ? <Notice tone="danger" live>{error}</Notice> : null}
      <fieldset aria-describedby={ratingError ? "rating-error" : undefined}>
        <legend className="text-sm font-semibold text-ink">Your rating</legend>
        <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              onMouseEnter={() => setHover(n)}
              className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setRatingError(null);
                }}
                className="sr-only"
              />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"} — {LABELS[n]}
              </span>
              <Star
                aria-hidden
                className={cn("size-9 transition sm:size-10", n <= shown ? "fill-accent text-accent" : "fill-transparent text-sand")}
                strokeWidth={1.4}
              />
            </label>
          ))}
          <span className="ml-3 text-sm font-semibold text-ink" aria-hidden>
            {LABELS[shown]}
          </span>
        </div>
        {ratingError ? (
          <p id="rating-error" role="alert" className="mt-2 text-sm text-danger">
            {ratingError}
          </p>
        ) : null}
      </fieldset>

      <Field id="review-comment" label="Your review" optional hint="Fit, quality, communication, timing — what should others know?">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          maxLength={1500}
          placeholder={`What was it like working with ${tailorName}?`}
          {...describedBy("review-comment", { hint: true })}
        />
      </Field>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Reviews are public and can’t be edited once published.</p>
        <Button type="submit" size="lg" loading={pending} loadingText="Publishing…">
          Publish review
        </Button>
      </div>
    </form>
  );
}
