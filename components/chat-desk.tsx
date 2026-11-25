"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MarkdownText } from "@/components/markdown-text";
import { SiteHeader } from "@/components/site-header";
import { LumenCard } from "@/components/lumen-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PublicSession } from "@/lib/demo";

const PROMPTS = [
  "I don't recognize the Night Market Electronics charge. Please dispute it.",
  "Show my recent transactions.",
  "What is the foreign transaction fee on Lumen Reserve?",
  "My card was stolen.",
  "I want to speak with a person.",
];

const STORAGE_KEY = "lumen-session";

export function ChatDesk({ embedded = false }: { embedded?: boolean }) {
  const params = useSearchParams();
  const asked = useRef(false);
  const [session, setSession] = useState<PublicSession | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [booting, setBooting] = useState(true);
  const [live, setLive] = useState<"sse" | "poll">("poll");
  const bottom = useRef<HTMLDivElement>(null);
  const sessionId = session?.id;

  function adopt(next: PublicSession) {
    setSession((current) => {
      if (current && current.id === next.id && next.messages.length < current.messages.length) return current;
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const response = await fetch(`/api/sessions/${stored}`);
        if (response.ok) {
          const body = (await response.json()) as { session: PublicSession };
          if (!cancelled) {
            adopt(body.session);
            setBooting(false);
          }
          return;
        }
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
      const created = await fetch("/api/sessions", { method: "POST" });
      const body = (await created.json()) as { session: PublicSession };
      if (!cancelled) {
        window.sessionStorage.setItem(STORAGE_KEY, body.session.id);
        adopt(body.session);
        setBooting(false);
      }
    }
    boot().catch(() => {
      if (!cancelled) {
        setError("The chat server didn't answer. Refresh and try again.");
        setBooting(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const source = new EventSource(`/api/sessions/${sessionId}/events`);
    source.addEventListener("session", (event) => {
      const next = JSON.parse((event as MessageEvent).data) as PublicSession;
      adopt(next);
      setLive("sse");
    });
    source.onerror = () => setLive("poll");
    const poll = window.setInterval(async () => {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const body = (await response.json()) as { session: PublicSession };
      adopt(body.session);
    }, 3000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [sessionId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [session?.messages.length, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message, stream: true }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "The message didn't send.");
        setDraft(message);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamed = "";
      let doneSession: PublicSession | null = null;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const event = part.match(/^event: (.+)$/m)?.[1];
          const data = part.match(/^data: (.+)$/m)?.[1];
          if (!data) continue;
          const payload = JSON.parse(data) as { text?: string; session?: PublicSession };
          if (event === "token" && payload.text) {
            streamed += payload.text;
            setStreaming(streamed);
          }
          if (event === "done" && payload.session) doneSession = payload.session;
        }
      }
      if (!doneSession) {
        setError("The reply stream ended early.");
        setDraft(message);
        return;
      }
      window.sessionStorage.setItem(STORAGE_KEY, doneSession.id);
      adopt(doneSession);
      setStreaming("");
    } catch {
      setError("The network dropped that message.");
      setDraft(message);
    } finally {
      setStreaming("");
      setSending(false);
    }
  }

  useEffect(() => {
    const ask = params.get("ask");
    if (!ask || asked.current || booting || !session) return;
    asked.current = true;
    void send(ask);
    // send is recreated each render; the ref guards a single auto-send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, booting, session?.id]);

  async function resetDemo() {
    await fetch("/api/demo/reset", { method: "POST" });
    window.sessionStorage.removeItem(STORAGE_KEY);
    const created = await fetch("/api/sessions", { method: "POST" });
    const body = (await created.json()) as { session: PublicSession };
    window.sessionStorage.setItem(STORAGE_KEY, body.session.id);
    adopt(body.session);
    setError(null);
  }

  const waitingOnPerson = session?.mode === "queue" || session?.mode === "agent";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {embedded ? (
        <p className="px-4 py-3 font-display text-xl">Lumen support</p>
      ) : (
        <SiteHeader />
      )}
      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 grid-rows-[auto_1fr] gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:grid-rows-1">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2 text-sm lg:hidden">
          <span>{session?.verified ? "Verified" : "Code 000000"}</span>
          <span>
            ···· {session?.card.last4 ?? "4419"} · {session?.card.status ?? "active"}
          </span>
          <Button variant="outline" size="sm" onClick={() => void resetDemo()}>
            Reset
          </Button>
        </div>
        <aside className="hidden flex-col gap-4 lg:flex">
          <LumenCard last4={session?.card.last4} status={session?.card.status} compact />
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">This chat</p>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Identity</dt>
                <dd>{session?.verified ? "Verified" : "Not verified"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reserve</dt>
                <dd className="capitalize">{session?.card.status ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Code</dt>
                <dd>000000</dd>
              </div>
            </dl>
            <p className="mt-3 text-muted-foreground">Jordan Hale · demo only. Full card numbers are masked.</p>
          </div>
          <Button variant="outline" onClick={() => void resetDemo()}>
            Reset demo
          </Button>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <h1 className="font-display text-2xl">Support</h1>
            <Badge variant={session?.verified ? "default" : "outline"}>
              {session?.verified ? "Verified" : "Code needed for actions"}
            </Badge>
            {waitingOnPerson ? <Badge variant="secondary">Specialist {session?.handoff?.id}</Badge> : null}
            <span className="ml-auto text-xs text-muted-foreground">{live === "sse" ? "Live" : "Checking for replies"}</span>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {booting ? <p className="text-sm text-muted-foreground">Opening a secure demo chat…</p> : null}
            {!booting && session?.messages.length === 0 ? (
              <div>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Ask about fees or disputes, or run the main path: verify, look at charges, and open a case on Night
                  Market Electronics.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {PROMPTS.map((prompt) => (
                    <Button key={prompt} variant="outline" className="h-auto whitespace-normal px-3 py-2 text-left" onClick={() => void send(prompt)}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {session?.messages.map((message) => (
              <article key={message.id} className={message.role === "user" ? "ml-auto max-w-[90%] sm:max-w-[75%]" : "max-w-[95%]"}>
                <p className="mb-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {message.role === "user" ? "You" : message.role === "agent" ? message.agentName ?? "Specialist" : message.role === "system" ? "Desk" : "Lumen"}
                </p>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? message.text : <MarkdownText text={message.text} />}
                </div>
                {message.dispute ? (
                  <ol className="mt-2 space-y-2 rounded-2xl border border-border p-3 text-sm">
                    <li className="font-medium">
                      {message.dispute.id} · {message.dispute.reasonLabel}
                    </li>
                    {message.dispute.timeline.map((step) => (
                      <li key={step.label} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lumen" />
                        <span>
                          <span className="font-medium">{step.label}</span>
                          <span className="text-muted-foreground"> · {step.state}. {step.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {message.tools?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {message.tools.map((item) => (
                      <li key={`${message.id}-${item.name}-${item.summary}`}>
                        <Badge variant="outline">{item.name}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.citations?.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Source: {message.citations.map((item) => item.title).join(", ")}
                  </p>
                ) : null}
              </article>
            ))}
            {sending ? (
              <p className="text-sm text-muted-foreground" role="status">
                {streaming ? <MarkdownText text={streaming} /> : "Checking the help center and the demo core…"}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div ref={bottom} />
          </div>

          <form
            className="border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            {!session?.verified ? (
              <div className="mb-2">
                <Button type="button" variant="secondary" onClick={() => void send("000000")}>
                  Use demo code 000000
                </Button>
              </div>
            ) : null}
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <Textarea
              id="message"
              value={draft}
              placeholder={waitingOnPerson ? "Add a note for the specialist" : "Ask Lumen, or paste the demo code"}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Enter to send. Shift+Enter for a new line.</p>
              <Button type="submit" disabled={sending || !draft.trim()}>
                Send
              </Button>
            </div>
          </form>
        </section>
      </div>
      <p className="px-4 pb-2 text-center text-[11px] text-muted-foreground">
        Portfolio demo by Quvantic - fictional brand, not a real business / not client work
      </p>
    </div>
  );
}
