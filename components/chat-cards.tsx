"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Check, Copy, Headphones } from "lucide-react";
import type { Citation } from "@/lib/demo";
import type { RichCard } from "@/lib/ui-cards";
import { DISPUTE_REASONS } from "@/lib/ui-cards";

function Shell({
  children,
  testId,
  className = "",
}: {
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`max-w-full rounded-[16px] border border-border bg-surface p-3 shadow-[var(--shadow-card)] dark:[&_img]:border dark:[&_img]:border-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function RichCards({
  cards,
  onChoose,
}: {
  cards: RichCard[];
  onChoose?: (text: string) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {cards.map((card, index) => {
        if (card.kind === "transactions") {
          return (
            <Shell key={`txn-${index}`} testId="card-transaction">
              <p className="text-[14px] font-semibold leading-5">Recent charges</p>
              <ul className="mt-2 divide-y divide-border">
                {card.items.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 text-[13.5px]">
                    <span>
                      <span className="block font-medium">{item.merchant}</span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {item.date} · {item.product} ···· {item.last4}
                      </span>
                    </span>
                    <span className="font-mono-nums text-[13px]">{item.amount}</span>
                  </li>
                ))}
              </ul>
            </Shell>
          );
        }
        if (card.kind === "timeline") {
          return (
            <Shell key={`time-${card.id}`} testId="card-timeline">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-semibold leading-5">Dispute {card.id}</p>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] text-foreground">{card.status}</span>
              </div>
              <ol className="mt-3 space-y-3 border-l-2 border-muted pl-3">
                {card.steps.map((step) => (
                  <li key={step.label} className="relative">
                    <span
                      className={`absolute -left-[17px] top-1 size-3 rounded-full border-2 border-surface ${
                        step.state === "done"
                          ? "bg-success"
                          : step.state === "current"
                            ? "bg-accent motion-safe:animate-pulse"
                            : "bg-transparent border-muted-foreground"
                      }`}
                    />
                    <p className="text-[14px] font-medium leading-5">{step.label}</p>
                    <p className="text-[12px] leading-4 text-muted-foreground">{step.detail}</p>
                  </li>
                ))}
              </ol>
            </Shell>
          );
        }
        if (card.kind === "status") {
          const locked = card.status !== "active";
          return (
            <Shell key={`status-${card.status}`} testId="card-status" className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold leading-5">{card.product}</p>
                <p className="font-mono-nums text-[13px] text-muted-foreground">···· {card.last4}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${locked ? "bg-gold-soft text-foreground" : "bg-accent-soft text-foreground"}`}
              >
                {card.status === "lost" ? "Locked · replacement" : locked ? "Locked" : "Unlocked"}
              </span>
            </Shell>
          );
        }
        if (card.kind === "fee") {
          return (
            <Shell key={card.title} testId="card-quote">
              <p className="text-[14px] font-semibold leading-5">{card.title}</p>
              <dl className="mt-2">
                {card.rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3 py-1 text-[13.5px]">
                    <dt>{row.label}</dt>
                    <dd className="font-mono-nums text-[13px]">{row.amount}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 border-t border-border pt-2 text-[11.5px] text-muted-foreground">{card.note}</p>
              {onChoose ? (
                <button
                  type="button"
                  className="mt-3 inline-flex h-11 min-h-11 items-center rounded-[14px] bg-accent px-3 text-[13px] font-medium text-accent-foreground"
                  onClick={() => onChoose("I want to speak with a person.")}
                >
                  Talk to a specialist
                </button>
              ) : null}
            </Shell>
          );
        }
        if (card.kind === "form") {
          return (
            <Shell key={card.title} testId="card-form">
              <p className="text-[14px] font-semibold leading-5">{card.title}</p>
              <p className="mt-1 text-[12px] text-muted-foreground">{card.subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 text-[13px] font-medium hover:bg-accent-soft"
                    onClick={() => onChoose?.(option.label)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Shell>
          );
        }
        if (card.kind === "confirm") {
          return (
            <Shell key={card.code} testId="card-confirm">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent-soft text-success">
                  <Check className="size-4" strokeWidth={1.75} />
                </span>
                <p className="text-[14px] font-semibold leading-5">{card.title}</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="font-mono-nums text-[13px]">{card.code}</p>
                <CopyButton value={card.code} />
              </div>
              <dl className="mt-2">
                {card.rows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 py-0.5 text-[13px]">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              {onChoose ? (
                <button
                  type="button"
                  className="mt-3 inline-flex h-11 items-center rounded-[14px] border border-border px-3 text-[13px] font-medium"
                  onClick={() => onChoose("I want to speak with a person.")}
                >
                  Talk to a person
                </button>
              ) : null}
            </Shell>
          );
        }
        return (
          <Shell key={card.ticketId} testId="card-handoff">
            <div className="flex items-center gap-2">
              <Headphones className="size-4" strokeWidth={1.75} />
              <p className="text-[14px] font-semibold leading-5">Connecting you with the Lumen desk</p>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              In this demo, the ticket appears in /admin. A specialist usually replies in a few minutes.
            </p>
            <p className="mt-2 font-mono-nums text-[13px]">{card.ticketId}</p>
          </Shell>
        );
      })}
    </div>
  );
}

export function DisputeReasonForm({ onChoose }: { onChoose: (text: string) => void }) {
  return (
    <Shell testId="card-form">
      <p className="text-[14px] font-semibold leading-5">Dispute Night Market Electronics</p>
      <p className="mt-1 text-[12px] leading-4 text-muted-foreground">
        Choose a reason. Enter the demo code when you are ready. Never type a full card number.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DISPUTE_REASONS.map((reason) => (
          <button
            key={reason.id}
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-[13px] font-medium hover:bg-accent-soft"
            onClick={() => onChoose(`Please dispute Night Market Electronics. Reason: ${reason.label}.`)}
          >
            {reason.label}
          </button>
        ))}
      </div>
    </Shell>
  );
}

export function CitationRow({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[11.5px] text-muted-foreground">Sources</span>
      {citations.slice(0, 3).map((citation) => (
        <CitationChip key={`${citation.slug}-${citation.heading}`} citation={citation} />
      ))}
    </div>
  );
}

function CitationChip({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        data-testid="citation-chip"
        className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-surface px-2 text-[11.5px] font-medium hover:bg-accent-soft"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <BookOpen className="size-3" strokeWidth={1.75} />
        {citation.title}
      </button>
      {open ? (
        <span
          data-testid="citation-preview"
          role="dialog"
          aria-label={citation.title}
          className="absolute bottom-full left-0 z-10 mb-1 w-64 rounded-[16px] border border-border bg-surface p-3 text-left shadow-[var(--shadow-card)]"
        >
          <span className="block text-[14px] font-semibold leading-5">{citation.title}</span>
          <span className="mt-1 line-clamp-3 block text-[13px] leading-5 text-muted-foreground">{citation.excerpt}</span>
          <a
            className="mt-2 inline-flex text-[13px] text-accent underline-offset-2 hover:underline"
            href={`/kb/${citation.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Open source <span className="sr-only">(opens in a new tab)</span>
          </a>
        </span>
      ) : null}
    </span>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11.5px] hover:bg-accent-soft"
      aria-label={done ? "Copied" : "Copy"}
      title={done ? "Copied" : "Copy"}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        });
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" strokeWidth={1.75} />}
      <span className="text-[11.5px]">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function ToolRows({ tools }: { tools: { name: string; ok: boolean; summary: string }[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {tools.map((tool) => (
        <li
          key={`${tool.name}-${tool.summary}`}
          className="flex h-10 items-center justify-between gap-2 rounded-[12px] border border-border px-2 text-[12px]"
        >
          <span className="truncate">{tool.name.replaceAll("_", " ")}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{tool.ok ? "Done" : "Failed"}</span>
        </li>
      ))}
    </ul>
  );
}
