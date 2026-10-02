"use server";

import "server-only";
import { DEMO_AI_URL, DEMO_MAX_PROMPT, DEMO_MODEL, DEMO_SYSTEM_PROMPT } from "@/lib/demo-agent";
import type { ActionResult } from "@/lib/types";

/**
 * Teaching demo, Path B: the browser sends only the question; the key is
 * added here, on the server, and never reaches the browser.
 * Local development only — in production this endpoint does nothing, so
 * it can't be used to spend AI credits.
 */
export async function askAgentOnServer(prompt: string): Promise<ActionResult<{ answer: string }>> {
  if (process.env.NODE_ENV === "production") return { ok: false, error: "This demo only runs locally." };

  const question = typeof prompt === "string" ? prompt.trim() : "";
  if (!question || question.length > DEMO_MAX_PROMPT) {
    return { ok: false, error: `Ask a question of 1–${DEMO_MAX_PROMPT} characters.` };
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, error: "OPENROUTER_API_KEY is not set in .env." };

  const res = await fetch(DEMO_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEMO_MODEL,
      max_tokens: 200,
      messages: [
        { role: "system", content: DEMO_SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  }).catch(() => null);

  if (!res?.ok) return { ok: false, error: `The AI provider answered ${res?.status ?? "nothing"}.` };
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const answer = json.choices?.[0]?.message?.content?.trim();
  return answer ? { ok: true, data: { answer } } : { ok: false, error: "The AI returned an empty answer." };
}
