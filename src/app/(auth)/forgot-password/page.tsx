import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
      <h1 className="font-display text-5xl leading-tight text-ink">Forgot your password?</h1>
      <p className="mt-3 text-muted">Enter your email and we’ll send you a link to choose a new one.</p>
      <ForgotPasswordForm />
    </>
  );
}
