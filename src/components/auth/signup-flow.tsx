"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Check, MailCheck, Scissors, Shirt } from "lucide-react";
import { signUp, type SignUpState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, describedBy } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import { PasswordInput } from "./password-input";

const ROLES: Record<
  Role,
  { title: string; lead: string; icon: React.ReactNode; blurb: string }
> = {
  customer: {
    title: "I need something made",
    lead: "Customer",
    icon: <Shirt />,
    blurb: "Post requests, compare offers, track your order.",
  },
  tailor: {
    title: "I make clothing",
    lead: "Tailor",
    icon: <Scissors />,
    blurb: "Find requests, send offers, deliver orders.",
  },
};

export function SignupFlow({ initialRole }: { initialRole: Role | null }) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [step, setStep] = useState<"role" | "details">(initialRole ? "details" : "role");
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, null);
  const [values, setValues] = useState({ full_name: "", email: "" });

  if (state?.ok && state.data) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-ink">Check your inbox</h1>
        <p className="mt-4 leading-relaxed text-muted" role="status">
          We’ve sent a confirmation link to <strong className="text-ink">{state.data.email}</strong>. Open it on this
          device to finish creating your {role === "tailor" ? "tailor" : "customer"} account.
        </p>
        <p className="mt-8 text-sm text-muted">
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (step === "role" || !role) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">How will you use MyTailor?</h1>
        <p className="mt-1.5 text-muted">Choose one. It can’t be changed later.</p>

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
                    "flex cursor-pointer items-center gap-4 rounded-[var(--radius-card)] border bg-paper p-4 transition",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2",
                    selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-stone",
                  )}
                >
                  <input type="radio" name="role-choice" value={r} checked={selected} onChange={() => setRole(r)} className="sr-only" />
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cream text-charcoal [&_svg]:size-5 [&_svg]:stroke-[1.5]">
                    {info.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{info.title}</span>
                    <span className="block text-sm text-muted">{info.blurb}</span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                      selected ? "border-ink bg-ink text-ivory" : "border-sand text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button size="lg" className="mt-8 w-full" disabled={!role} onClick={() => setStep("details")}>
          Continue
        </Button>
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline decoration-stone underline-offset-4 hover:decoration-ink">
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
      <button
        type="button"
        onClick={() => setStep("role")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back
      </button>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">Create your account</h1>

      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-paper p-3 pr-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-cream text-charcoal [&_svg]:size-4 [&_svg]:stroke-[1.5]">{info.icon}</span>
        <p className="min-w-0 flex-1 text-sm font-medium text-ink">Joining as a {info.lead.toLowerCase()}</p>
        <button type="button" onClick={() => setStep("role")} className="text-sm font-semibold text-ink underline underline-offset-4">
          Change
        </button>
      </div>

      <form action={action} className="mt-7 space-y-5" noValidate>
        <input type="hidden" name="role" value={role} />
        {state && !state.ok && !state.fieldErrors ? (
          <Notice tone="danger" live>
            {state.error}
          </Notice>
        ) : null}
        <Field id="full_name" label={role === "tailor" ? "Your name or studio name" : "Your name"} error={fe.full_name}>
          <Input
            name="full_name"
            autoComplete={role === "tailor" ? "organization" : "name"}
            required
            maxLength={80}
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
            required
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            {...describedBy("email", { error: fe.email })}
          />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters." error={fe.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            {...describedBy("password", { hint: true, error: fe.password })}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending} loadingText="Creating your account…">
          Create {role} account
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>{" "}
          summary.
        </p>
      </form>
    </div>
  );
}
