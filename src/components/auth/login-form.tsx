"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, type SignInState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, describedBy } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, null);
  const [email, setEmail] = useState("");
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {state && !state.ok && !state.fieldErrors ? (
        <Notice tone="danger" live>
          {state.error}
        </Notice>
      ) : null}
      <Field id="email" label="Email" error={fe.email}>
        <Input type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} {...describedBy("email", { error: fe.email })} />
      </Field>
      <Field id="password" label="Password" error={fe.password}>
        <PasswordInput name="password" autoComplete="current-password" required {...describedBy("password", { error: fe.password })} />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-muted hover:text-ink">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Signing in…">
        Sign in
      </Button>
    </form>
  );
}
