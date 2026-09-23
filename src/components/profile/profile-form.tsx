"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { TAILOR_SPECIALTIES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const toast = useToast();
  const isTailor = profile.role === "tailor";
  const [values, setValues] = useState({
    full_name: profile.full_name,
    city: profile.city ?? "",
    bio: profile.bio ?? "",
    specialties: profile.specialties ?? [],
    years_experience: profile.years_experience == null ? "" : String(profile.years_experience),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(s: string) {
    setValues((v) => ({
      ...v,
      specialties: v.specialties.includes(s) ? v.specialties.filter((x) => x !== s) : [...v.specialties, s],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    start(async () => {
      const res = await updateProfile(values);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setFormError(res.error);
        return;
      }
      setErrors({});
      toast.success(res.message ?? "Saved.");
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {formError ? <Notice tone="danger" live>{formError}</Notice> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="full_name" label={isTailor ? "Name or studio name" : "Name"} error={errors.full_name}>
          <Input value={values.full_name} onChange={(e) => setValues({ ...values, full_name: e.target.value })} maxLength={80} {...describedBy("full_name", { error: errors.full_name })} />
        </Field>
        <Field id="city" label="City" optional error={errors.city} hint={isTailor ? "Shown to customers with your offers." : "Shown to tailors on your requests."}>
          <Input value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} maxLength={80} placeholder="e.g. Kuwait City" {...describedBy("city", { hint: true, error: errors.city })} />
        </Field>
      </div>

      {isTailor ? (
        <>
          <Field id="years_experience" label="Years of experience" optional error={errors.years_experience} className="max-w-xs">
            <Input
              inputMode="numeric"
              value={values.years_experience}
              onChange={(e) => setValues({ ...values, years_experience: e.target.value.replace(/\D/g, "").slice(0, 2) })}
              {...describedBy("years_experience", { error: errors.years_experience })}
            />
          </Field>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Specialties</legend>
            <p className="mt-1 text-[0.82rem] text-muted">Choose what you do best. Customers see these next to your offers.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TAILOR_SPECIALTIES.map((s) => {
                const on = values.specialties.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                      on ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-stone",
                    )}
                  >
                    {on ? <Check className="size-3.5" aria-hidden /> : null}
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field id="bio" label="About your work" optional error={errors.bio} hint={`${values.bio.length}/600 — your training, style, the fabrics you love working with.`}>
            <Textarea value={values.bio} onChange={(e) => setValues({ ...values, bio: e.target.value })} rows={5} maxLength={600} {...describedBy("bio", { hint: true, error: errors.bio })} />
          </Field>
        </>
      ) : null}

      <div className="flex justify-end border-t border-line pt-6">
        <Button type="submit" loading={pending} loadingText="Saving…">
          Save profile
        </Button>
      </div>
    </form>
  );
}
