"use server";

import { revalidatePath } from "next/cache";
import { GARMENT_TYPES } from "@/lib/constants";
import { friendlyError, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export interface RequestInput {
  title: string;
  description: string;
  garment_type: string;
  desired_date: string;
  image_path: string | null;
  ai_assisted?: boolean;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function validate(input: RequestInput) {
  const errors: Record<string, string> = {};
  const title = input.title?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  if (title.length < 3) errors.title = "Give your request a short title (at least 3 characters).";
  if (title.length > 120) errors.title = "Please keep the title under 120 characters.";
  if (!GARMENT_TYPES.some((g) => g.value === input.garment_type)) errors.garment_type = "Choose the type of garment.";
  if (description.length < 10) errors.description = "Describe what you’d like made (at least 10 characters).";
  if (description.length > 4000) errors.description = "Please shorten the description (4,000 characters max).";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.desired_date ?? "")) errors.desired_date = "Choose the date you need it by.";
  else if (input.desired_date < todayISO()) errors.desired_date = "Choose a date that hasn’t passed yet.";
  return { errors, title, description };
}

export async function createRequest(input: RequestInput): Promise<ActionResult<{ id: string }>> {
  const { errors, title, description } = validate(input);
  if (Object.keys(errors).length) return { ok: false, error: "Please check the highlighted details.", fieldErrors: errors };

  const supabase = await createClient();
  // customer_id defaults to auth.uid() in the database and cannot be supplied by the client.
  const { data, error } = await supabase
    .from("requests")
    .insert({
      title,
      description,
      garment_type: input.garment_type,
      desired_date: input.desired_date,
      image_path: input.image_path || null,
      ai_assisted: Boolean(input.ai_assisted),
    })
    .select("id")
    .single();

  if (error || !data) {
    logError("createRequest", error);
    return { ok: false, error: friendlyError(error, "We couldn’t post your request. Please try again.") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  return { ok: true, data: { id: data.id } };
}

export async function updateRequest(id: string, input: RequestInput): Promise<ActionResult<{ id: string }>> {
  const { errors, title, description } = validate(input);
  if (Object.keys(errors).length) return { ok: false, error: "Please check the highlighted details.", fieldErrors: errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .update({
      title,
      description,
      garment_type: input.garment_type,
      desired_date: input.desired_date,
      image_path: input.image_path || null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    logError("updateRequest", error);
    return { ok: false, error: friendlyError(error, "We couldn’t save your changes. Please try again.") };
  }
  if (!data) {
    // RLS filtered the row: not the owner, or the request has closed.
    return { ok: false, error: "This request can no longer be edited. Requests close once you choose a tailor." };
  }

  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  return { ok: true, data: { id } };
}
