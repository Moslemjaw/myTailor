import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Choose a new password</h1>
      <p className="mt-1.5 text-muted">Use at least 8 characters. You’ll be signed in afterwards.</p>
      <ResetPasswordForm />
    </>
  );
}
