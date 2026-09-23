import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-tight text-ink">Choose a new password</h1>
      <p className="mt-3 text-muted">Use at least 8 characters. You’ll be signed in afterwards.</p>
      <ResetPasswordForm />
    </>
  );
}
