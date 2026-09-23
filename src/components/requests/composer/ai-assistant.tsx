"use client";

import { useState, useTransition } from "react";
import { ImagePlus, RotateCcw, Sparkles, X } from "lucide-react";
import { suggestDescription } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/field";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "suggestion"; text: string }
  | { kind: "error"; message: string };

/**
 * Optional helper. It only ever proposes text; nothing reaches the customer's
 * description until they press "Use" — and they can edit it before and after.
 */
export function AiAssistant({
  imagePath,
  context,
  hasOwnDescription,
  onUse,
  onGoToImage,
}: {
  imagePath: string | null;
  context: { title: string; garmentType: string; notes: string };
  hasOwnDescription: boolean;
  onUse: (text: string, mode: "replace" | "append") => void;
  onGoToImage: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  function run() {
    if (!imagePath) return;
    setState({ kind: "loading" });
    startTransition(async () => {
      const res = await suggestDescription({
        imagePath,
        title: context.title,
        garmentType: context.garmentType,
        notes: context.notes,
      });
      setState(res.ok && res.data ? { kind: "suggestion", text: res.data.suggestion } : { kind: "error", message: res.ok ? "" : res.error });
    });
  }

  return (
    <section
      aria-labelledby="ai-assistant-title"
      className="rounded-3xl border border-accent/20 bg-gradient-to-b from-accent-soft/70 to-paper p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-paper text-accent ring-1 ring-accent/20">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="ai-assistant-title" className="font-semibold text-ink">
            Description assistant
          </h3>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            Get a suggested description from your reference photo. It’s only a starting point — you decide what goes in
            your request.
          </p>
        </div>
      </div>

      <div className="mt-5" aria-live="polite">
        {!imagePath ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-sand bg-paper/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Add a reference photo to get a suggestion.</p>
            <Button variant="secondary" size="sm" icon={<ImagePlus className="size-4" />} onClick={onGoToImage}>
              Add a photo
            </Button>
          </div>
        ) : state.kind === "idle" ? (
          <Button variant="accent" icon={<Sparkles className="size-4" />} onClick={run}>
            Suggest a description
          </Button>
        ) : state.kind === "loading" || pending ? (
          <div className="rounded-2xl border border-line bg-paper p-4" role="status">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Sparkles className="size-4 animate-pulse text-accent" aria-hidden />
              Studying the silhouette, fabric and details…
            </p>
            <div className="mt-4 space-y-2" aria-hidden>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-[92%]" />
              <div className="skeleton h-3 w-[70%]" />
            </div>
          </div>
        ) : state.kind === "error" ? (
          <Notice
            tone="warning"
            title="No suggestion this time"
            action={
              <Button variant="secondary" size="sm" icon={<RotateCcw className="size-4" />} onClick={run}>
                Try again
              </Button>
            }
          >
            {state.message}
          </Notice>
        ) : (
          <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="ai-suggestion" className="text-xs font-semibold tracking-wide text-accent uppercase">
                Suggestion — edit freely before using
              </label>
              <button
                type="button"
                onClick={() => setState({ kind: "idle" })}
                className="rounded-full p-1.5 text-muted hover:bg-cream hover:text-ink"
                aria-label="Dismiss suggestion"
              >
                <X className="size-4" />
              </button>
            </div>
            <Textarea
              id="ai-suggestion"
              value={state.text}
              onChange={(e) => setState({ kind: "suggestion", text: e.target.value })}
              rows={7}
              className="min-h-44 border-transparent bg-ivory/60 text-[0.92rem]"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {hasOwnDescription ? (
                <>
                  <Button size="sm" onClick={() => { onUse(state.text, "append"); setState({ kind: "idle" }); }}>
                    Add below my description
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { onUse(state.text, "replace"); setState({ kind: "idle" }); }}>
                    Replace mine
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => { onUse(state.text, "replace"); setState({ kind: "idle" }); }}>
                  Use this description
                </Button>
              )}
              <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={run}>
                Try again
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setState({ kind: "idle" })}>
                Ignore
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
