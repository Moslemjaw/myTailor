"use server";

import { revalidatePath } from "next/cache";
import { friendlyError, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export interface OfferInput {
  requestId: string;
  price: string | number;
  turnaroundDays: string | number;
  message: string;
}

/** Submit or revise the current tailor's single offer (the RPC decides which). */
export async function submitOffer(input: OfferInput): Promise<ActionResult<{ revision: number }>> {
  const price = Number(input.price);
  const days = Number(input.turnaroundDays);
  const message = (input.message ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!Number.isFinite(price) || price <= 0) fieldErrors.price = "Enter your price.";
  else if (price > 100000) fieldErrors.price = "That price looks too high. Please check it.";
  if (!Number.isInteger(days) || days < 1) fieldErrors.turnaround = "Enter the number of days you need.";
  else if (days > 365) fieldErrors.turnaround = "Please keep the turnaround within a year.";
  if (message.length < 10) fieldErrors.message = "Add a short note so the customer knows your approach.";
  else if (message.length > 1500) fieldErrors.message = "Please keep your note under 1,500 characters.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted details.", fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("submit_offer", {
      p_request_id: input.requestId,
      p_price: price,
      p_turnaround_days: days,
      p_message: message,
    })
    .single<{ revision: number }>();

  if (error || !data) {
    logError("submitOffer", error);
    return { ok: false, error: friendlyError(error, "We couldn’t send your offer. Please try again.") };
  }

  revalidatePath(`/browse/${input.requestId}`);
  revalidatePath("/browse");
  revalidatePath("/offers");
  revalidatePath("/dashboard");
  return {
    ok: true,
    data: { revision: data.revision },
    message: data.revision > 1 ? "Your offer has been updated." : "Your offer has been sent.",
  };
}

export async function declineOffer(requestId: string, offerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decline_offer", { p_offer_id: offerId });
  if (error) {
    logError("declineOffer", error);
    return { ok: false, error: friendlyError(error, "We couldn’t decline this offer. Please try again.") };
  }
  revalidatePath(`/requests/${requestId}`);
  return { ok: true, message: "Offer declined. The tailor can still revise it while your request is open." };
}

/**
 * Accepting is a single database transaction: request closes, other offers
 * freeze, order is created. Only the request owner can succeed.
 */
export async function acceptOffer(requestId: string, offerId: string): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_offer", { p_request_id: requestId, p_offer_id: offerId });
  if (error || !data) {
    logError("acceptOffer", error);
    return { ok: false, error: friendlyError(error, "We couldn’t accept this offer. Please try again.") };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { ok: true, data: { orderId: data as string } };
}
