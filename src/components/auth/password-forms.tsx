"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, updatePassword, type ResetState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, describedBy } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, null);
  const [email, setEmail] = useState("");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  if (state?.ok) {
    return (
      <Notice tone="success" className="mt-8" title="Check your inbox" live>
        {state.message}
      </Notice>
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...describedBy("email", { error: fe.email })}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Sending link…">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePassword, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {state && !state.ok && !state.fieldErrors ? <Notice tone="danger" live>{state.error}</Notice> : null}
      <Field id="password" label="New password" error={fe.password}>
        <PasswordInput name="password" autoComplete="new-password" required minLength={8} {...describedBy("password", { error: fe.password })} />
      </Field>
      <Field id="confirm" label="Confirm new password" error={fe.confirm}>
        <PasswordInput name="confirm" autoComplete="new-password" required {...describedBy("confirm", { error: fe.confirm })} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Saving…">
        Save new password
      </Button>
    </form>
  );
}
