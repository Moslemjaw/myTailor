import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/login" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
      <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Forgot your password?</h1>
      <p className="mt-1.5 text-muted">We’ll email you a link to choose a new one.</p>
      <ForgotPasswordForm />
    </>
  );
}
