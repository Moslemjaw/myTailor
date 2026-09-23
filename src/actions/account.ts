"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { TAILOR_SPECIALTIES } from "@/lib/constants";
import { friendlyError, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function markNotificationsRead(ids?: string[]): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please sign in to continue." };
  const supabase = await createClient();
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) return { ok: false, error: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface ProfileInput {
  full_name: string;
  city: string;
  bio: string;
  specialties: string[];
  years_experience: string;
}

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Please sign in to continue." };

  const fieldErrors: Record<string, string> = {};
  const fullName = input.full_name.trim();
  const city = input.city.trim();
  const bio = input.bio.trim();
  if (fullName.length < 2 || fullName.length > 80) fieldErrors.full_name = "Please enter a name between 2 and 80 characters.";
  if (city.length > 80) fieldErrors.city = "Please use a shorter city name.";
  if (bio.length > 600) fieldErrors.bio = "Please keep this under 600 characters.";

  // Role is not accepted here and cannot be updated at the database level either.
  const update: Record<string, unknown> = { full_name: fullName, city: city || null, bio: bio || null };

  if (viewer.profile.role === "tailor") {
    const specialties = (input.specialties ?? []).filter((s) => TAILOR_SPECIALTIES.includes(s)).slice(0, 12);
    const years = input.years_experience === "" ? null : Number(input.years_experience);
    if (years !== null && (!Number.isInteger(years) || years < 0 || years > 80)) {
      fieldErrors.years_experience = "Enter a number of years between 0 and 80.";
    }
    update.specialties = specialties;
    update.years_experience = years;
  }
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", viewer.id);
  if (error) {
    logError("updateProfile", error);
    return { ok: false, error: friendlyError(error, "We couldn’t save your profile. Please try again.") };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Your profile has been saved." };
}
