"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Lock, Send } from "lucide-react";
import { askAgentOnServer } from "@/actions/demo";
import { DEMO_AI_URL, DEMO_MAX_PROMPT, DEMO_MODEL, DEMO_SYSTEM_PROMPT } from "@/lib/demo-agent";
import { cn } from "@/lib/cn";

type Path = "A" | "B";
type Message = { role: "user" | "agent" | "note"; text: string; path: Path };

// PATH A — the mistake on purpose. NEXT_PUBLIC_ means Next.js pastes this value
// into the JavaScript the browser downloads. Use a throwaway key with a tiny
// credit limit, and revoke it after class. Without one, a fake key is sent:
// the request fails, but DevTools still shows it leaving the browser.
const BROWSER_KEY = process.env.NEXT_PUBLIC_DEMO_OPENROUTER_KEY || "FAKE-DEMO-KEY-1234567890";

async function askAgentFromBrowser(question: string): Promise<{ answer?: string; note?: string }> {
  const res = await fetch(DEMO_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${BROWSER_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEMO_MODEL,
      max_tokens: 200,
      messages: [
        { role: "system", content: DEMO_SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    }),
  }).catch(() => null);

  if (!res) return { note: "The request couldn't reach the AI provider — but check Network: it still left your browser." };
  if (res.status === 401) {
    return { note: "The provider rejected the key (it's a fake one) — but open the request in DevTools: the key was sent from your browser." };
  }
  if (!res.ok) return { note: `The AI provider answered ${res.status}.` };
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return { answer: json.choices?.[0]?.message?.content?.trim() || "(empty answer)" };
}

const STEPS: Record<Path, { title: string; lead: string; steps: string[] }> = {
  A: {
    title: "Path A — browser → AI provider",
    lead: "The browser calls the AI directly, so the key has to be in the browser.",
    steps: [
      "Press F12 and open the Network tab.",
      "Send a question, then click the “completions” request.",
      "Headers → authorization: there's the key.",
      "Payload → the whole system prompt is visible too.",
      "Sources → Ctrl+Shift+F → search the key: it's in the JS file.",
    ],
  },
  B: {
    title: "Path B — browser → your server → AI provider",
    lead: "The browser sends only the question. The server adds the key.",
    steps: [
      "Keep the Network tab open.",
      "Send a question, then click the request to this page.",
      "Payload: only your question. Response: only the answer.",
      "No authorization header, no system prompt.",
      "Ctrl+Shift+F → search the key: 0 results.",
    ],
  },
};

export function AgentDemo() {
  const [path, setPath] = useState<Path>("A");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const info = STEPS[path];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: question, path }]);

    let reply: Message;
    if (path === "A") {
      const { answer, note } = await askAgentFromBrowser(question);
      reply = answer ? { role: "agent", text: answer, path } : { role: "note", text: note ?? "", path };
    } else {
      const res = await askAgentOnServer(question);
      reply = res.ok
        ? { role: "agent", text: res.data?.answer ?? "", path }
        : { role: "note", text: res.error, path };
    }
    setMessages((m) => [...m, reply]);
    setBusy(false);
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl content-start gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8 lg:px-8">
      <section className="flex min-w-0 flex-col gap-5 sm:gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Class demo · local only</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">Keeping secrets server-side</h1>
          <p className="mt-2 text-muted">Same tailoring assistant, two ways to call the AI. Open DevTools and compare.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-1.5" role="tablist" aria-label="Request path">
          {(["A", "B"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={path === p}
              onClick={() => setPath(p)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition-colors",
                path === p ? (p === "A" ? "bg-danger text-paper" : "bg-info text-paper") : "text-muted hover:text-ink",
              )}
            >
              {p === "A" ? <KeyRound className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
              <span>Path {p}</span>
              <span className="hidden sm:inline">· key {p === "A" ? "in browser" : "on server"}</span>
            </button>
          ))}
        </div>

        <div className={cn("rounded-2xl border p-4 sm:p-6", path === "A" ? "border-danger/30 bg-danger-soft" : "border-info/30 bg-info-soft")}>
          <h2 className="font-semibold text-ink">{info.title}</h2>
          <p className="mt-1 text-sm text-muted">{info.lead}</p>
          <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm text-ink">
            {info.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="flex h-[70dvh] min-h-[26rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-paper lg:sticky lg:top-10 lg:h-[calc(100dvh-5rem)]">
        <div className="border-b border-line px-5 py-4">
          <p className="font-semibold text-ink">Tailor assistant</p>
          <p className="text-xs text-muted">Ask about fabrics, fit or garment care</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 && (
            <p className="m-auto max-w-xs text-center text-sm text-muted">
              Try: “What fabric is best for a summer suit?”
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm [overflow-wrap:anywhere]",
                m.role === "user" && "self-end bg-ink text-ivory",
                m.role === "agent" && "self-start bg-cream text-ink",
                m.role === "note" && "self-center border border-warning/30 bg-warning-soft text-center text-ink",
              )}
            >
              <span className="mb-0.5 block text-[0.7rem] font-semibold tracking-wide uppercase opacity-60">
                {m.role === "user" ? "You" : m.role === "agent" ? "Assistant" : "Heads up"} · Path {m.path}
              </span>
              {m.text}
            </div>
          ))}
          {busy && <p className="self-start text-sm text-muted">Thinking…</p>}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
          <label htmlFor="demo-question" className="sr-only">Your question</label>
          <input
            id="demo-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={DEMO_MAX_PROMPT}
            placeholder={`Ask via Path ${path}…`}
            className="h-11 min-w-0 flex-1 rounded-full border border-field bg-paper px-4 text-base text-ink outline-none focus:border-ink sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-ivory disabled:opacity-50 sm:px-5"
          >
            <Send className="size-4" /> <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </main>
  );
}
