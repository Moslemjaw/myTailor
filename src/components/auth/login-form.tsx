"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Mail } from "lucide-react";
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
      <Field
        id="password"
        label="Password"
        error={fe.password}
        labelAction={
          <Link href="/forgot-password" className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            Forgot password?
          </Link>
        }
      >
        <PasswordInput name="password" autoComplete="current-password" required {...describedBy("password", { error: fe.password })} />
      </Field>
      <Button type="submit" size="lg" className="mt-2 w-full" loading={pending} loadingText="Signing in…">
        Sign in
      </Button>
    </form>
  );
}
