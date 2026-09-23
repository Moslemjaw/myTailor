"use server";

import { revalidatePath } from "next/cache";
import { friendlyError, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, OrderStatus } from "@/lib/types";

const MESSAGES: Record<string, string> = {
  in_progress: "Work has started. Your customer has been told.",
  ready: "Marked as ready. Your customer has been told.",
  completed: "Order completed. Your customer can now leave a review.",
};

export async function advanceOrder(orderId: string, to: OrderStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order", { p_order_id: orderId, p_to_status: to });
  if (error) {
    logError("advanceOrder", error);
    return { ok: false, error: friendlyError(error, "We couldn’t update this order. Please try again.") };
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true, message: MESSAGES[to] };
}

export async function createReview(orderId: string, rating: number, comment: string): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please choose a rating from 1 to 5 stars.", fieldErrors: { rating: "Choose a rating." } };
  }
  if (comment.trim().length > 1500) {
    return { ok: false, error: "Please keep your review under 1,500 characters.", fieldErrors: { comment: "Too long." } };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_review", {
    p_order_id: orderId,
    p_rating: rating,
    p_comment: comment.trim(),
  });
  if (error) {
    logError("createReview", error);
    return { ok: false, error: friendlyError(error, "We couldn’t save your review. Please try again.") };
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}/review`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true, message: "Thank you — your review has been published." };
}
