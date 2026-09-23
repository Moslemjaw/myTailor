"use server";

import { revalidatePath } from "next/cache";
import { GARMENT_TYPES, SIZES, cleanMeasurements } from "@/lib/constants";
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
  size?: string | null;
  /** Centimetres as typed; empty values are ignored. */
  measurements?: Record<string, string> | null;
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
  const size = input.size ? String(input.size) : null;
  if (size && !(SIZES as readonly string[]).includes(size)) errors.size = "Choose a size from the list.";
  const measurements = cleanMeasurements(input.measurements);
  Object.assign(errors, measurements.errors);
  return { errors, title, description, size, measurements: measurements.data };
}

/** Measurements live in their own RLS-protected table (visible to the chosen tailor only). */
async function saveMeasurements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestId: string,
  data: Record<string, number> | null,
) {
  if (data) {
    return supabase.from("request_measurements").upsert({ request_id: requestId, data, updated_at: new Date().toISOString() });
  }
  return supabase.from("request_measurements").delete().eq("request_id", requestId);
}

export async function createRequest(input: RequestInput): Promise<ActionResult<{ id: string }>> {
  const { errors, title, description, size, measurements } = validate(input);
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
      size,
    })
    .select("id")
    .single();

  if (error || !data) {
    logError("createRequest", error);
    return { ok: false, error: friendlyError(error, "We couldn’t post your request. Please try again.") };
  }

  if (measurements) {
    const m = await saveMeasurements(supabase, data.id, measurements);
    if (m.error) {
      // The request is live; tell the customer the optional part didn't save.
      logError("createRequest.measurements", m.error);
      revalidatePath("/requests");
      return { ok: true, data: { id: data.id }, message: "measurements-failed" };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  return { ok: true, data: { id: data.id } };
}

export async function updateRequest(id: string, input: RequestInput): Promise<ActionResult<{ id: string }>> {
  const { errors, title, description, size, measurements } = validate(input);
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
      size,
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

  const m = await saveMeasurements(supabase, id, measurements);
  if (m.error) {
    logError("updateRequest.measurements", m.error);
    return { ok: false, error: "Your changes were saved, but the measurements couldn’t be updated. Please try again." };
  }

  revalidatePath(`/requests/${id}`);
  revalidatePath("/requests");
  return { ok: true, data: { id } };
}
