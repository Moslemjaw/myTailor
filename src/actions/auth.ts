"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, logError } from "@/lib/errors";
import { safeNext, siteUrl } from "@/lib/site-url";
import type { ActionResult } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpState = ActionResult<{ email: string }> | null;

export async function signUp(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (role !== "customer" && role !== "tailor") fieldErrors.role = "Choose how you’ll use MyTailor.";
  if (fullName.length < 2) fieldErrors.full_name = "Please enter your name.";
  if (fullName.length > 80) fieldErrors.full_name = "Please use a shorter name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const origin = await siteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The database trigger reads these once to create the profile; the role cannot be changed later.
      data: { role, full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    logError("signUp", error);
    return { ok: false, error: friendlyError(error, "We couldn’t create your account. Please try again.") };
  }

  // Supabase returns a user with no identities when the email is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, error: friendlyError({ message: "User already registered" }) };
  }

  if (data.session) redirect("/dashboard?welcome=1");
  return { ok: true, data: { email } };
}

export type SignInState = ActionResult | null;

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const fieldErrors: Record<string, string> = {};
  if (!EMAIL.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (!password) fieldErrors.password = "Please enter your password.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: friendlyError(error, "We couldn’t sign you in. Please try again.") };
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ResetState = ActionResult | null;

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return { ok: false, error: "Please enter a valid email address.", fieldErrors: { email: "Please enter a valid email address." } };
  }
  const supabase = await createClient();
  const origin = await siteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error && (error.status === 429 || /rate limit/i.test(error.message))) {
    return { ok: false, error: friendlyError(error) };
  }
  if (error) logError("resetPassword", error);
  // Same response whether or not the account exists.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  if (password !== confirm) fieldErrors.confirm = "The passwords don’t match.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { ok: false, error: "This reset link has expired. Please request a new one." };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: friendlyError(error, "We couldn’t update your password. Please try again.") };
  redirect("/dashboard?password=updated");
}
