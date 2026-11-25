"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Check, Monitor, Smartphone } from "lucide-react";
import { RichCards } from "@/components/chat-cards";
import { LumenCard } from "@/components/lumen-card";
import { OpsToast } from "@/components/ops-toast";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";
import { SiteHeader } from "@/components/site-header";
import { SiteLauncher } from "@/components/site-launcher";
import { SupportChat } from "@/components/support-chat";
import { BRAND, METRICS, TRY_ASKING } from "@/lib/brand";
import type { RichCard } from "@/lib/ui-cards";

const steps = [
  { n: "01", title: "Channel", body: "The site chat, the embed, WhatsApp, and Messenger share one desk." },
  { n: "02", title: "Retrieve", body: "Answers come from 21 help-center articles, with the source named." },
  { n: "03", title: "Tools", body: "A one-time code unlocks charges, a freeze, a lost card, or a dispute." },
  { n: "04", title: "Desk", body: "Fraud, a complaint, or a legal threat lands with a person in /admin." },
];

const gallery: RichCard[] = [
  {
    kind: "transactions",
    items: [
      { id: "txn_1003", merchant: "City Transit", amount: "$2.75", date: "Nov 18", last4: "8821", product: "Everyday" },
    ],
  },
  {
    kind: "timeline",
    id: "Sample",
    status: "In review",
    steps: [
      { label: "Opened", detail: "The case is on the fictional core.", state: "done" },
      { label: "In review", detail: "The merchant is asked for documents.", state: "current" },
      { label: "Resolved", detail: "A decision posts to the thread.", state: "upcoming" },
    ],
  },
  {
    kind: "fee",
    title: "Published fees",
    rows: [
      { label: "Annual fee", amount: "$0.00" },
      { label: "Late fee, up to", amount: "$30.00" },
    ],
    note: "Sample range for this demo, not a bill.",
  },
  { kind: "status", product: "Lumen Reserve", last4: "4419", status: "active" },
];

const snippet = `<script src="${BRAND.liveUrl}/widget.js" data-endpoint="${BRAND.liveUrl}"></script>`;

const does = [
  "Answers fee and dispute questions from the help center",
  "Shows masked charges after the demo code",
  "Opens a dispute with a timeline and a case id",
  "Locks the card and hands fraud to a person",
];
const wont = [
  "Invent a balance, fee, or case id",
  "Give financial, tax, or legal advice",
  "Pretend to be a person",
  "Promise when a payment or dispute will finish",
];

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<"desktop" | "phone">("desktop");
  return (
    <div className="min-h-full pb-28">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">Fictional neobank · Halden Bay</p>
            <h1 className="mt-3 max-w-xl text-[48px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[64px]">
              Support that can <span className="font-serif italic">see the card</span>, and knows when to stop.
            </h1>
            <p className="mt-5 max-w-xl text-[18px] leading-7 text-muted-foreground">
              Lumen Card answers from a help center, calls a mock core after a one-time code, and sends fraud,
              complaints, and legal threats to a person.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground"
                onClick={() => {
                  document.getElementById("live-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  window.dispatchEvent(
                    new CustomEvent("lumen:send", { detail: "When will my payment post?" }),
                  );
                }}
              >
                Chat now
              </button>
              <Link
                href="/embed-demo"
                className="inline-flex h-11 items-center rounded-full border border-border px-4 text-sm font-medium"
              >
                See the embed
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              Not a bank. Not legal, tax, or financial advice. Card numbers in this demo are fake and stay masked.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {TRY_ASKING.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  data-testid="try-asking"
                  className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-[13px] font-medium"
                  onClick={() => {
                    document.getElementById("live-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    window.dispatchEvent(new CustomEvent("lumen:send", { detail: item.prompt }));
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div data-testid="trust-panel" className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] border border-border bg-surface p-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">What it does</p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {does.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[16px] border border-border bg-surface p-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">What it won&apos;t do</p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {wont.map((item) => (
                    <li key={item} className="flex justify-between gap-2">
                      <span>{item}</span>
                      <span className="text-danger">✕</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div id="live-chat" data-testid="landing-hero-chat">
            <div className="mb-2 flex justify-end gap-2">
              <button
                type="button"
                data-testid="preview-desktop"
                aria-pressed={preview === "desktop"}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2 text-[12px]"
                onClick={() => setPreview("desktop")}
              >
                <Monitor className="size-3.5" /> Desktop
              </button>
              <button
                type="button"
                data-testid="preview-phone"
                aria-pressed={preview === "phone"}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2 text-[12px]"
                onClick={() => setPreview("phone")}
              >
                <Smartphone className="size-3.5" /> Phone
              </button>
            </div>
            <div
              className={`mx-auto h-[640px] ${preview === "phone" ? "w-[390px] rounded-[28px] border border-border p-2" : "w-full max-w-[400px]"}`}
            >
              <Suspense fallback={<p className="p-4 text-sm">Opening the desk…</p>}>
                <SupportChat variant="frame" />
              </Suspense>
            </div>
          </div>
        </section>

        <section data-testid="metrics-strip" className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4">
          {METRICS.map((item) => (
            <div key={item.label} className="border-t border-border py-4">
              <p className="text-[12px] text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.03em]">{item.value}</p>
            </div>
          ))}
        </section>

        <section id="how" className="mx-auto grid max-w-6xl gap-3 px-4 py-14 sm:px-6 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.n} className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <p className="text-[12px] tracking-[0.16em] text-muted-foreground">{step.n}</p>
              <h2 className="mt-2 text-[22px] font-medium tracking-[-0.03em]">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="text-[32px] font-medium tracking-[-0.03em]">What the desk can show</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The same cards that appear in the thread. Amounts are the fictional Halden Bay profile.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[280px_1fr]">
            <LumenCard />
            <div className="grid gap-3 md:grid-cols-2">
              <RichCards cards={gallery} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="text-[32px] font-medium tracking-[-0.03em]">Embed</h2>
          <div className="mt-4 flex items-start justify-between gap-3 rounded-[16px] border border-border bg-surface p-4">
            <pre className="overflow-x-auto font-mono text-[13px] leading-6">{snippet}</pre>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-[13px]"
              onClick={() => {
                void navigator.clipboard?.writeText(snippet).then(() => setCopied(true));
              }}
            >
              {copied ? <Check className="size-3.5" /> : null}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>
          {BRAND.address}.{" "}
          <a className="underline-offset-2 hover:underline" href={BRAND.repoUrl}>
            GitHub
          </a>
        </p>
        <PortfolioDisclaimer />
      </footer>
      <OpsToast />
      <SiteLauncher />
    </div>
  );
}
