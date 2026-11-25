"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { InboxBoard } from "@/components/inbox-board";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, Dispute, Handoff } from "@/lib/demo";

type DeskHandoff = Handoff & {
  preview: string;
  cardStatus: string;
  messages: ChatMessage[];
  disputes: Dispute[];
};

export function AdminDesk() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<DeskHandoff[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/handoffs");
    if (response.status === 401) {
      setAuthed(false);
      return;
    }
    if (!response.ok) {
      setError("The desk couldn't load the queue.");
      return;
    }
    const body = (await response.json()) as { handoffs: DeskHandoff[] };
    setAuthed(true);
    setHandoffs(body.handoffs);
    setSelectedId((current) => current ?? body.handoffs[0]?.id ?? null);
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load().catch(() => setError("The desk lost its connection."));
    }, 2000);
    const kick = window.setTimeout(() => {
      void load().catch(() => setError("The desk lost its connection."));
    }, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(kick);
    };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setLoginError("That password doesn't match lumen-demo.");
      return;
    }
    setPassword("");
    await load();
  }

  const selected = handoffs.find((item) => item.id === selectedId) ?? null;

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setError(null);
    const response = await fetch(`/api/admin/handoffs/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply, agentName: "Alex Rivera" }),
    });
    setSending(false);
    if (!response.ok) {
      setError("The reply didn't reach the customer.");
      return;
    }
    setReply("");
    await load();
  }

  async function resolve() {
    if (!selected) return;
    const response = await fetch(`/api/admin/handoffs/${selected.id}/resolve`, { method: "POST" });
    if (!response.ok) {
      setError("Couldn't close that handoff.");
      return;
    }
    await load();
  }

  return (
    <div className="dark flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <p className="font-display text-2xl">Lumen desk</p>
          <p className="text-xs text-muted-foreground">Specialist console · fictional queue</p>
        </div>
        <Link href="/chat" className="text-sm underline-offset-4 hover:underline">
          Customer chat
        </Link>
      </header>
      <InboxBoard />

      {authed === false ? (
        <main className="mx-auto max-w-md px-4 py-10">
          <form onSubmit={login} className="rounded-2xl border border-border bg-card p-5">
            <h1 className="font-display text-3xl">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The demo password is <span className="text-foreground">lumen-demo</span>. Replies you send show up in the
              customer chat.
            </p>
            <label htmlFor="desk-password" className="mt-4 block text-sm">
              Password
            </label>
            <Input
              id="desk-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-10"
            />
            {loginError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {loginError}
              </p>
            ) : null}
            <Button type="submit" className="mt-4 h-10 px-4">
              Enter the desk
            </Button>
          </form>
        </main>
      ) : null}

      {authed ? (
        <main className="grid min-h-0 flex-1 gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl border border-border bg-card">
            <h1 className="border-b border-border px-4 py-3 font-display text-xl">Queue</h1>
            {handoffs.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No one is waiting. In the customer chat, ask for a person, mention a lawyer, or say the charge is
                ridiculous.
              </p>
            ) : (
              <ul>
                {handoffs.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full border-b border-border px-4 py-3 text-left ${item.id === selectedId ? "bg-muted" : ""}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.id}</span>
                        <Badge variant={item.status === "waiting" ? "default" : "outline"}>{item.status}</Badge>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.category} · {item.sentiment} · {item.verified ? "verified" : "not verified"}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm">{item.preview}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card">
            {!selected ? (
              <p className="p-6 text-sm text-muted-foreground">Select a handoff to read the summary and reply.</p>
            ) : (
              <>
                <div className="border-b border-border px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl">{selected.id}</h2>
                    <Badge>{selected.sentiment}</Badge>
                    <Badge variant="outline">{selected.verified ? "Verified" : "Not verified"}</Badge>
                    <Badge variant="secondary">{selected.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reserve card is {selected.cardStatus}.
                    {selected.disputes.length ? ` Cases: ${selected.disputes.map((item) => item.id).join(", ")}.` : ""}
                  </p>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                  {selected.messages.map((message) => (
                    <article key={message.id}>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {message.role === "agent" ? message.agentName : message.role}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                    </article>
                  ))}
                </div>
                {error ? (
                  <p className="px-4 text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <form
                  className="border-t border-border p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendReply();
                  }}
                >
                  <label htmlFor="reply" className="sr-only">
                    Reply to the customer
                  </label>
                  <Textarea
                    id="reply"
                    value={reply}
                    placeholder="Reply as Alex Rivera"
                    onChange={(event) => setReply(event.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="submit" disabled={sending || !reply.trim() || selected.status === "resolved"}>
                      Send to the chat
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void resolve()} disabled={selected.status === "resolved"}>
                      Resolve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const response = await fetch(`/api/admin/handoffs/${selected.id}/resume`, { method: "POST" });
                        if (!response.ok) {
                          setError("Couldn't hand the chat back to the assistant.");
                          return;
                        }
                        await load();
                      }}
                    >
                      Resume bot
                    </Button>
                  </div>
                </form>
              </>
            )}
          </section>
        </main>
      ) : null}
      {authed === null ? <p className="px-6 text-sm text-muted-foreground">Checking the desk sign-in…</p> : null}
      <PortfolioDisclaimer className="px-4 pb-3 text-[11px] text-muted-foreground sm:px-6" />
    </div>
  );
}
