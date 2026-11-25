"use client";

import { useEffect, useState, type ReactNode } from "react";

type Inbox = {
  conversations: { id: string; verified: boolean; mode: string; messages: { role: string; text: string }[] }[];
  handoffs: { id: string; status: string; sentiment: string; verified: boolean; summary: string }[];
  tickets: { id: string; merchant: string; status: string; sessionId: string }[];
  toolCalls: { name: string; ok: boolean; summary: string; sessionId: string }[];
};

export function InboxBoard() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      void fetch("/api/inbox")
        .then(async (response) => {
          if (!response.ok) throw new Error("inbox");
          setInbox((await response.json()) as Inbox);
        })
        .catch(() => setError("The inbox didn't load."));
    };
    const timer = window.setInterval(tick, 3000);
    const kick = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(kick);
    };
  }, []);

  if (error) return <p className="px-4 text-sm text-destructive">{error}</p>;
  if (!inbox) return <p className="px-4 text-sm text-muted-foreground">Loading the desk inbox…</p>;

  return (
    <div className="grid gap-3 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
      <Section title="Conversations" empty="No chats yet.">
        {inbox.conversations.map((item) => (
          <li key={item.id}>
            {item.mode} · {item.verified ? "verified" : "not verified"} · {item.messages.length} messages
          </li>
        ))}
      </Section>
      <Section title="Handoffs" empty="No handoffs.">
        {inbox.handoffs.map((item) => (
          <li key={item.id}>
            {item.id} · {item.status} · {item.sentiment} · {item.verified ? "verified" : "not verified"}
          </li>
        ))}
      </Section>
      <Section title="Tickets" empty="No dispute cases.">
        {inbox.tickets.map((item) => (
          <li key={item.id}>
            {item.id} · {item.merchant} · {item.status}
          </li>
        ))}
      </Section>
      <Section title="Tool calls" empty="No tools yet.">
        {inbox.toolCalls.slice(-8).map((item, index) => (
          <li key={`${item.sessionId}-${item.name}-${index}`}>
            {item.name} · {item.ok ? "ok" : "blocked"}
          </li>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const list = Array.isArray(children) ? children : [children];
  const filled = list.some(Boolean);
  return (
    <section className="rounded-2xl border border-border bg-card p-3 text-sm">
      <h2 className="font-display text-lg">{title}</h2>
      {filled ? <ul className="mt-2 space-y-1 text-muted-foreground">{children}</ul> : <p className="mt-2 text-muted-foreground">{empty}</p>}
    </section>
  );
}
