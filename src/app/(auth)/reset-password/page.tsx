import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Choose a new password</h1>
      <p className="mt-1.5 text-muted">You’ll stay signed in afterwards.</p>
      <ResetPasswordForm />
    </>
  );
}
