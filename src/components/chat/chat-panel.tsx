"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Lock, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

type LocalMessage = Message & { state?: "sending" | "failed" };

const STARTERS = ["Hello! Looking forward to working with you.", "When would suit you for measurements?", "Could we talk about fabric options?"];

/**
 * Chat for one order. Reads and writes go straight to Postgres with the
 * user's session; RLS only admits the order's customer and tailor, and
 * Realtime applies the same policy to live updates.
 */
export function ChatPanel({
  orderId,
  me,
  names,
  counterpartName,
  initialMessages,
  className,
  header,
}: {
  orderId: string;
  me: string;
  names: Record<string, string>;
  counterpartName: string;
  initialMessages: Message[];
  className?: string;
  header?: React.ReactNode;
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [live, setLive] = useState<"connecting" | "live" | "offline">("connecting");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Live updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-chat:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload: { new: Record<string, unknown> }) => {
          const m = payload.new as unknown as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe((status: string) => {
        setLive(status === "SUBSCRIBED" ? "live" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "offline" : "connecting");
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Keep scrolled to newest
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(body: string, retryId?: string) {
    const text = body.trim();
    if (!text) return;
    const tempId = retryId ?? `temp-${crypto.randomUUID()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      order_id: orderId,
      sender_id: me,
      body: text,
      created_at: new Date().toISOString(),
      state: "sending",
    };
    setMessages((prev) => (retryId ? prev.map((m) => (m.id === retryId ? optimistic : m)) : [...prev, optimistic]));
    if (!retryId) setDraft("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ order_id: orderId, body: text })
      .select("id, order_id, sender_id, body, created_at")
      .single();

    setMessages((prev) => {
      if (error || !data) return prev.map((m) => (m.id === tempId ? { ...m, state: "failed" } : m));
      const withoutDupes = prev.filter((m) => m.id !== (data as Message).id);
      return withoutDupes.map((m) => (m.id === tempId ? (data as Message) : m));
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(draft);
    }
  }

  // auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper", className)} aria-label={`Chat with ${counterpartName}`}>
      {header}
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3" aria-hidden /> Private to you and {counterpartName}
        </span>
        <span className="inline-flex items-center gap-1.5" aria-live="polite">
          <span className={cn("size-1.5 rounded-full", live === "live" ? "bg-success" : live === "offline" ? "bg-danger" : "bg-stone")} aria-hidden />
          {live === "live" ? "Live" : live === "offline" ? "Reconnecting…" : "Connecting…"}
        </span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <Avatar name={counterpartName} size="lg" />
            <p className="mt-4 font-semibold text-ink">Start the conversation about your order.</p>
            <p className="mt-1 max-w-xs text-sm text-muted">Share measurements, fabric choices and fitting times with {counterpartName}.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-line bg-ivory px-3 py-1.5 text-xs font-medium text-ink hover:border-stone"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {messages.map((m, i) => {
              const mine = m.sender_id === me;
              const day = formatDate(m.created_at);
              const prev = messages[i - 1];
              const showDay = !prev || formatDate(prev.created_at) !== day;
              const grouped = prev && prev.sender_id === m.sender_id && !showDay;
              return (
                <li key={m.id}>
                  {showDay ? (
                    <p className="my-4 text-center text-[0.7rem] font-semibold tracking-wide text-muted uppercase">{day}</p>
                  ) : null}
                  <div className={cn("flex", mine ? "justify-end" : "justify-start", !grouped && "mt-3")}>
                    <div className={cn("max-w-[82%] sm:max-w-[75%]")}>
                      {!grouped && !mine ? <p className="mb-1 ml-1 text-xs font-semibold text-muted">{names[m.sender_id] ?? counterpartName}</p> : null}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-[0.92rem] leading-relaxed break-words whitespace-pre-wrap",
                          mine ? "rounded-br-md bg-ink text-ivory" : "rounded-bl-md bg-cream text-ink",
                          m.state === "sending" && "opacity-60",
                          m.state === "failed" && "bg-danger-soft text-danger ring-1 ring-danger/30",
                        )}
                      >
                        <span className="sr-only">{mine ? "You" : names[m.sender_id] ?? counterpartName}: </span>
                        {m.body}
                      </div>
                      <p className={cn("mt-1 text-[0.68rem] text-muted", mine ? "mr-1 text-right" : "ml-1")}>
                        {m.state === "sending" ? (
                          "Sending…"
                        ) : m.state === "failed" ? (
                          <button type="button" onClick={() => send(m.body, m.id)} className="inline-flex items-center gap-1 font-semibold text-danger underline">
                            <RotateCcw className="size-3" aria-hidden /> Not sent — tap to retry
                          </button>
                        ) : (
                          formatTime(m.created_at)
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="pb-safe border-t border-line bg-paper p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-ivory p-1.5 pl-4 focus-within:border-ink">
          <label htmlFor={`chat-input-${orderId}`} className="sr-only">
            Message {counterpartName}
          </label>
          <textarea
            id={`chat-input-${orderId}`}
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder={`Message ${counterpartName}…`}
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[0.95rem] text-ink placeholder:text-stone focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-ivory transition hover:bg-charcoal disabled:bg-sand disabled:text-muted"
            aria-label="Send message"
          >
            {messages.some((m) => m.state === "sending") ? <Spinner className="size-4" /> : <ArrowUp className="size-4" />}
          </button>
        </div>
        <p className="mt-1.5 hidden px-1 text-[0.68rem] text-muted sm:block">Enter to send · Shift + Enter for a new line</p>
      </form>
    </section>
  );
}
