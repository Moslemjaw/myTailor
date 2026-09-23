"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Pencil, Sparkles } from "lucide-react";
import { createRequest, updateRequest } from "@/actions/requests";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { GARMENT_TYPES, garmentLabel } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { describeDeadline, formatDate } from "@/lib/format";
import { AiAssistant } from "./ai-assistant";
import { ImageUploader, type UploadedImage } from "./image-uploader";

const STEPS = [
  { key: "basics", label: "The basics", hint: "Title and garment type" },
  { key: "reference", label: "Reference", hint: "Optional photo" },
  { key: "description", label: "Description", hint: "What you’d like made" },
  { key: "timing", label: "Timing", hint: "When you need it" },
  { key: "review", label: "Review", hint: "Check and post" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export interface ComposerValues {
  title: string;
  garment_type: string;
  description: string;
  desired_date: string;
  image: UploadedImage | null;
  ai_assisted: boolean;
}

const DRAFT_KEY = "mytailor:request-draft";

function isoIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RequestComposer({
  userId,
  mode,
  requestId,
  initial,
  offerCount = 0,
}: {
  userId: string;
  mode: "create" | "edit";
  requestId?: string;
  initial?: ComposerValues;
  offerCount?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<StepKey>(mode === "edit" ? "review" : "basics");
  const [values, setValues] = useState<ComposerValues>(
    initial ?? { title: "", garment_type: "", description: "", desired_date: "", image: null, ai_assisted: false },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restored = useRef(false);

  // Restore / persist an unsent draft (per-browser convenience only).
  useEffect(() => {
    if (mode !== "create" || restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<ComposerValues> & { image?: { path: string } | null };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage
        setValues((v) => ({ ...v, ...draft, image: null }));
      }
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "create") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, image: null }));
    } catch {
      /* ignore */
    }
  }, [values, mode]);

  const index = STEPS.findIndex((s) => s.key === step);
  const today = useMemo(() => isoIn(0), []);

  function set<K extends keyof ComposerValues>(key: K, value: ComposerValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!e[key as string]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }

  function validate(key: StepKey) {
    const e: Record<string, string> = {};
    if (key === "basics" || key === "review") {
      if (values.title.trim().length < 3) e.title = "Give your request a short title (at least 3 characters).";
      if (!values.garment_type) e.garment_type = "Choose the type of garment.";
    }
    if (key === "description" || key === "review") {
      if (values.description.trim().length < 10) e.description = "Describe what you’d like made (at least 10 characters).";
      if (values.description.length > 4000) e.description = "Please shorten the description (4,000 characters max).";
    }
    if (key === "timing" || key === "review") {
      if (!values.desired_date) e.desired_date = "Choose the date you need it by.";
      else if (values.desired_date < today) e.desired_date = "Choose a date that hasn’t passed yet.";
    }
    setErrors(e);
    return e;
  }

  function goTo(target: StepKey) {
    setStep(target);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function next() {
    const e = validate(step);
    if (Object.keys(e).length) return;
    goTo(STEPS[Math.min(index + 1, STEPS.length - 1)].key);
  }

  function back() {
    setErrors({});
    goTo(STEPS[Math.max(index - 1, 0)].key);
  }

  function submit() {
    const e = validate("review");
    if (Object.keys(e).length) {
      const first = e.title || e.garment_type ? "basics" : e.description ? "description" : "timing";
      goTo(first);
      return;
    }
    setSubmitError(null);
    startSubmit(async () => {
      const payload = {
        title: values.title,
        description: values.description,
        garment_type: values.garment_type,
        desired_date: values.desired_date,
        image_path: values.image?.path ?? null,
        ai_assisted: values.ai_assisted,
      };
      const res = mode === "create" ? await createRequest(payload) : await updateRequest(requestId!, payload);
      if (!res.ok) {
        setSubmitError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        return;
      }
      if (mode === "create") {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.push(`/requests/${res.data!.id}?created=1`);
      } else {
        toast.success("Your request has been updated.");
        router.push(`/requests/${requestId}`);
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-14">
      {/* Stepper — sidebar on desktop, progress bar on mobile */}
      <nav aria-label="Request steps" className="lg:sticky lg:top-10 lg:self-start">
        <div className="lg:hidden">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{STEPS[index].label}</span>
            <span className="text-muted">
              Step {index + 1} of {STEPS.length}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.key} className={cn("h-1 flex-1 rounded-full transition", i <= index ? "bg-ink" : "bg-line")} />
            ))}
          </div>
        </div>
        <ol className="hidden space-y-1 lg:block">
          {STEPS.map((s, i) => {
            const done = i < index;
            const current = i === index;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => (i < index || mode === "edit" ? goTo(s.key) : undefined)}
                  disabled={i > index && mode === "create"}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                    current ? "bg-paper ring-1 ring-line" : "hover:bg-paper/60 disabled:hover:bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      done ? "border-ink bg-ink text-ivory" : current ? "border-ink text-ink" : "border-field text-muted",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span>
                    <span className={cn("block text-sm font-semibold", current || done ? "text-ink" : "text-muted")}>{s.label}</span>
                    <span className="block text-xs text-muted">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0 pb-24 lg:pb-0">
        {mode === "edit" && offerCount > 0 ? (
          <Notice tone="info" className="mb-6">
            {offerCount === 1 ? "A tailor has" : `${offerCount} tailors have`} already made an offer. They’ll see your
            updated details, and may revise their offer.
          </Notice>
        ) : null}

        <div key={step} className="animate-fade-up">
          {step === "basics" ? (
            <StepShell headingRef={headingRef} title="What would you like made?" lead="A short title and the type of garment.">
              <Field id="title" label="Request title" hint="For example: “Navy three-piece suit for a wedding”." error={errors.title}>
                <Input
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  maxLength={120}
                  placeholder="Give your request a title"
                  autoFocus={mode === "create"}
                  {...describedBy("title", { hint: true, error: errors.title })}
                />
              </Field>
              <fieldset className="mt-8" aria-describedby={errors.garment_type ? "garment-error" : undefined}>
                <legend className="mb-3 text-sm font-semibold text-ink">Type of garment</legend>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {GARMENT_TYPES.map((g) => {
                    const selected = values.garment_type === g.value;
                    return (
                      <label
                        key={g.value}
                        className={cn(
                          "flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border px-3 text-center text-sm font-medium transition",
                          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2",
                          selected ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-stone",
                        )}
                      >
                        <input
                          type="radio"
                          name="garment_type"
                          value={g.value}
                          checked={selected}
                          onChange={() => set("garment_type", g.value)}
                          className="sr-only"
                        />
                        {g.label}
                      </label>
                    );
                  })}
                </div>
                {errors.garment_type ? (
                  <p id="garment-error" role="alert" className="mt-2 text-sm text-danger">
                    {errors.garment_type}
                  </p>
                ) : null}
              </fieldset>
            </StepShell>
          ) : null}

          {step === "reference" ? (
            <StepShell
              headingRef={headingRef}
              title="Add a reference image"
              lead="Optional. Helps tailors see the style — and lets AI suggest a description."
            >
              <ImageUploader userId={userId} value={values.image} onChange={(img) => set("image", img)} />
              <p className="mt-3 text-xs text-muted">Private — only visible to tailors viewing your request.</p>
            </StepShell>
          ) : null}

          {step === "description" ? (
            <StepShell headingRef={headingRef} title="Describe what you want" lead="Fit, fabric, colour, occasion — in your own words.">
              <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
                <Field
                  id="description"
                  label="Your description"
                  hint={`${values.description.length.toLocaleString()} / 4,000 characters`}
                  error={errors.description}
                >
                  <Textarea
                    value={values.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={9}
                    maxLength={4000}
                    placeholder="e.g. A slim-fit black suit for a wedding. Single-breasted, notch lapels, two buttons. I’d like it in wool with a subtle texture."
                    {...describedBy("description", { hint: true, error: errors.description })}
                  />
                  {values.ai_assisted ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <Sparkles className="size-3.5" aria-hidden /> Started from an AI suggestion — edited and approved by you
                    </p>
                  ) : null}
                </Field>
                <AiAssistant
                  imagePath={values.image?.path ?? null}
                  context={{ title: values.title, garmentType: garmentLabel(values.garment_type), notes: values.description }}
                  hasOwnDescription={values.description.trim().length > 0}
                  onGoToImage={() => goTo("reference")}
                  onUse={(text, how) => {
                    set("description", how === "append" && values.description.trim() ? `${values.description.trim()}\n\n${text}` : text);
                    set("ai_assisted", true);
                    requestAnimationFrame(() => document.getElementById("description")?.focus());
                  }}
                />
              </div>
            </StepShell>
          ) : null}

          {step === "timing" ? (
            <StepShell headingRef={headingRef} title="When do you need it?" lead="Leave a little time for a fitting.">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick choices">
                {[
                  ["In 2 weeks", 14],
                  ["In 1 month", 30],
                  ["In 2 months", 60],
                ].map(([label, days]) => {
                  const iso = isoIn(days as number);
                  const active = values.desired_date === iso;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set("desired_date", iso)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        active ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-stone",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <Field id="desired_date" label="Or pick a date" className="mt-6 max-w-xs" error={errors.desired_date}>
                <Input
                  type="date"
                  min={today}
                  value={values.desired_date}
                  onChange={(e) => set("desired_date", e.target.value)}
                  {...describedBy("desired_date", { error: errors.desired_date })}
                />
              </Field>
              {values.desired_date && !errors.desired_date ? (
                <p className="mt-4 text-sm text-muted">
                  Needed by <strong className="text-ink">{formatDate(values.desired_date)}</strong> ({describeDeadline(values.desired_date).split("·").pop()?.trim()}).
                </p>
              ) : null}
            </StepShell>
          ) : null}

          {step === "review" ? (
            <StepShell
              headingRef={headingRef}
              title={mode === "create" ? "Review your request" : "Edit your request"}
              lead={mode === "create" ? "This is what tailors will see." : "Update any section, then save."}
            >
              <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
                {values.image ? (
                  <div className="border-b border-line bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={values.image.previewUrl} alt="Your reference image" className="mx-auto max-h-80 w-full object-contain" />
                  </div>
                ) : null}
                <dl className="divide-y divide-line">
                  <ReviewRow label="Title" onEdit={() => goTo("basics")} error={errors.title}>
                    <span className="text-lg font-semibold">{values.title || "—"}</span>
                  </ReviewRow>
                  <ReviewRow label="Garment" onEdit={() => goTo("basics")} error={errors.garment_type}>
                    {values.garment_type ? garmentLabel(values.garment_type) : "—"}
                  </ReviewRow>
                  <ReviewRow label="Reference image" onEdit={() => goTo("reference")}>
                    {values.image ? "Added" : <span className="text-muted">None — optional</span>}
                  </ReviewRow>
                  <ReviewRow label="Description" onEdit={() => goTo("description")} error={errors.description}>
                    <p className="leading-relaxed whitespace-pre-line">{values.description || "—"}</p>
                    {values.ai_assisted ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent">
                        <Sparkles className="size-3.5" aria-hidden /> Started from an AI suggestion
                      </p>
                    ) : null}
                  </ReviewRow>
                  <ReviewRow label="Needed by" onEdit={() => goTo("timing")} error={errors.desired_date}>
                    {values.desired_date ? formatDate(values.desired_date) : "—"}
                  </ReviewRow>
                </dl>
              </div>
              {submitError ? (
                <Notice tone="danger" className="mt-6" live>
                  {submitError}
                </Notice>
              ) : null}
            </StepShell>
          ) : null}
        </div>

        {/* Actions — sticky bar on phones */}
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-md lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 lg:mx-0 lg:max-w-none">
            {index > 0 && !(mode === "edit" && step === "review") ? (
              <Button variant="ghost" onClick={back} icon={<ArrowLeft className="size-4" />}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {step === "review" ? (
              <Button size="lg" onClick={submit} loading={submitting} loadingText={mode === "create" ? "Posting…" : "Saving…"}>
                {mode === "create" ? "Post request" : "Save changes"}
              </Button>
            ) : (
              <Button size="lg" onClick={next} icon={<ArrowRight className="order-last size-4" />}>
                {step === "reference" && !values.image ? "Skip for now" : step === "timing" ? "Review" : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  lead,
  children,
  headingRef,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold tracking-[-0.02em] text-ink outline-none">
        {title}
      </h2>
      <p className="mt-1.5 mb-8 max-w-xl text-muted">{lead}</p>
      {children}
    </section>
  );
}

function ReviewRow({
  label,
  children,
  onEdit,
  error,
}: {
  label: string;
  children: React.ReactNode;
  onEdit: () => void;
  error?: string;
}) {
  return (
    <div className="flex gap-4 p-5 sm:p-6">
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
        <dd className="mt-1.5 text-ink">{children}</dd>
        {error ? <p className="mt-2 text-sm text-danger" role="alert">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-full px-3 text-sm font-semibold text-ink hover:bg-cream"
        aria-label={`Edit ${label.toLowerCase()}`}
      >
        <Pencil className="size-3.5" aria-hidden /> Edit
      </button>
    </div>
  );
}
