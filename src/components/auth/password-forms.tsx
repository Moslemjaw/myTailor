"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { requestPasswordReset, updatePassword, type ResetState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, describedBy } from "@/components/ui/field";
import { PasswordInput, PasswordStrength } from "./password-input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, null);
  const [email, setEmail] = useState("");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  if (state?.ok) {
    return (
      <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-paper p-6 text-center" role="status">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-success-soft text-success">
          <MailCheck className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="mt-4 font-semibold text-ink">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">{state.message}</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state && !state.ok && !state.fieldErrors ? <Notice tone="danger" live>{state.error}</Notice> : null}
      <Field id="email" label="Email" error={fe.email}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          icon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...describedBy("email", { error: fe.email })}
        />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={pending} loadingText="Sending link…">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePassword, null);
  const [password, setPassword] = useState("");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state && !state.ok && !state.fieldErrors ? <Notice tone="danger" live>{state.error}</Notice> : null}
      <Field id="password" label="New password" error={fe.password}>
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...describedBy("password", { error: fe.password })}
        />
        {!fe.password ? <PasswordStrength value={password} /> : null}
      </Field>
      <Field id="confirm" label="Confirm new password" error={fe.confirm}>
        <PasswordInput name="confirm" autoComplete="new-password" required {...describedBy("confirm", { error: fe.confirm })} />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={pending} loadingText="Saving…">
        Save new password
      </Button>
    </form>
  );
}
