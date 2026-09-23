"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Check, Mail, MailCheck, Scissors, Shirt, UserRound } from "lucide-react";
import { signUp, type SignUpState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, describedBy } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import { PasswordInput, PasswordStrength } from "./password-input";

const ROLES: Record<Role, { title: string; label: string; icon: React.ReactNode; blurb: string }> = {
  customer: {
    title: "I need something made",
    label: "Customer",
    icon: <Shirt />,
    blurb: "Post requests, compare offers, track your order.",
  },
  tailor: {
    title: "I make clothing",
    label: "Tailor",
    icon: <Scissors />,
    blurb: "Find requests, send offers, deliver orders.",
  },
};

function Steps({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-8" aria-label={`Step ${current} of 2`}>
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-1 flex-1 rounded-full bg-ink" />
        <span className={cn("h-1 flex-1 rounded-full transition-colors", current === 2 ? "bg-ink" : "bg-line")} />
      </div>
      <p className="mt-2.5 text-xs font-medium text-muted">
        Step {current} of 2 · {current === 1 ? "Choose your role" : "Your details"}
      </p>
    </div>
  );
}

export function SignupFlow({ initialRole }: { initialRole: Role | null }) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [step, setStep] = useState<"role" | "details">(initialRole ? "details" : "role");
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, null);
  const [values, setValues] = useState({ full_name: "", email: "", password: "" });

  if (state?.ok && state.data) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Check your inbox</h1>
        <p className="mt-2 text-muted" role="status">
          We sent a confirmation link to <strong className="font-semibold text-ink">{state.data.email}</strong>. Open it to
          finish setting up your account.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-field px-5 text-sm font-semibold text-ink transition hover:border-ink"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (step === "role" || !role) {
    return (
      <div>
        <Steps current={1} />
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Create your account</h1>
        <p className="mt-1.5 text-muted">How will you use MyTailor? This can’t be changed later.</p>

        <fieldset className="mt-8">
          <legend className="sr-only">Choose your role</legend>
          <div className="grid gap-3">
            {(Object.keys(ROLES) as Role[]).map((r) => {
              const info = ROLES[r];
              const selected = role === r;
              return (
                <label
                  key={r}
                  className={cn(
                    "group flex cursor-pointer items-center gap-4 rounded-[var(--radius-card)] border bg-paper p-4 transition",
                    "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink/15",
                    selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-field hover:border-stone",
                  )}
                >
                  <input type="radio" name="role-choice" value={r} checked={selected} onChange={() => setRole(r)} className="sr-only" />
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors [&_svg]:size-5 [&_svg]:stroke-[1.5]",
                      selected ? "bg-ink text-ivory" : "bg-cream text-charcoal",
                    )}
                  >
                    {info.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{info.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{info.blurb}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition",
                      selected ? "border-ink bg-ink text-ivory" : "border-field text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button size="lg" className="mt-8 w-full" disabled={!role} onClick={() => setStep("details")}>
          Continue
        </Button>
        <p className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-field underline-offset-4 hover:decoration-ink">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const info = ROLES[role];
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <div>
      <Steps current={2} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.02em] text-ink">Your details</h1>
          <p className="mt-1.5 inline-flex items-center gap-2 text-muted">
            <span className="flex size-6 items-center justify-center rounded-md bg-cream text-charcoal [&_svg]:size-3.5 [&_svg]:stroke-[1.75]">{info.icon}</span>
            Joining as a {info.label.toLowerCase()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStep("role")}
          className="mt-1.5 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:bg-cream hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Change
        </button>
      </div>

      <form action={action} className="mt-8 space-y-5" noValidate>
        <input type="hidden" name="role" value={role} />
        {state && !state.ok && !state.fieldErrors ? (
          <Notice tone="danger" live>
            {state.error}
          </Notice>
        ) : null}
        <Field id="full_name" label={role === "tailor" ? "Name or studio name" : "Full name"} error={fe.full_name}>
          <Input
            name="full_name"
            autoComplete={role === "tailor" ? "organization" : "name"}
            placeholder={role === "tailor" ? "e.g. Hassan Tailoring" : "e.g. Sara Al-Ahmad"}
            required
            maxLength={80}
            icon={<UserRound />}
            value={values.full_name}
            onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
            {...describedBy("full_name", { error: fe.full_name })}
          />
        </Field>
        <Field id="email" label="Email" error={fe.email}>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            icon={<Mail />}
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            {...describedBy("email", { error: fe.email })}
          />
        </Field>
        <Field id="password" label="Password" error={fe.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            {...describedBy("password", { error: fe.password })}
            aria-describedby={fe.password ? "password-error" : "password-strength"}
          />
          {!fe.password ? <PasswordStrength value={values.password} id="password-strength" /> : null}
        </Field>
        <Button type="submit" size="lg" className="mt-2 w-full" loading={pending} loadingText="Creating your account…">
          Create account
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
