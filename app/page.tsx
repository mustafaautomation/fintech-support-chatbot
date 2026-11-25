import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { LumenCard } from "@/components/lumen-card";
import { Button } from "@/components/ui/button";

const steps = [
  { n: "01", title: "Verify", body: "Jordan Hale’s demo code is 000000. Account actions wait for it." },
  { n: "02", title: "Read the card", body: "Recent charges come back masked. Night Market Electronics is the one to question." },
  { n: "03", title: "Open a case", body: "The assistant files a billing-error dispute and returns a case id plus the timeline." },
  { n: "04", title: "Hand off", body: "Fraud, a complaint, a legal threat, or an angry customer lands on the agent desk." },
];

const topics = [
  ["Fees", "What is the annual fee?"],
  ["Foreign purchases", "What is the foreign transaction fee on Lumen Reserve?"],
  ["Disputes", "How long does a Regulation Z billing-error dispute take?"],
  ["Freeze", "How do I freeze my card?"],
  ["Lost card", "How long does a replacement card take?"],
  ["Rewards", "How do rewards points redeem?"],
];

export default function HomePage() {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Fictional neobank · Halden Bay</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.05] sm:text-6xl">
              Support that can see the card, and knows when to stop.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Lumen Card is a portfolio demo of a support assistant. It answers from a help center, calls a mock core
              after a one-time code, and sends fraud, complaints, and legal threats to a person.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<Link href="/chat?ask=I%20don%27t%20recognize%20the%20Night%20Market%20Electronics%20charge.%20Please%20dispute%20it." />}
                className="h-11 px-4"
              >
                Dispute a charge
              </Button>
              <Button nativeButton={false} render={<Link href="/admin" />} variant="outline" className="h-11 px-4">
                Open the agent desk
              </Button>
            </div>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              Not a bank. Not legal, tax, or financial advice. Card numbers in this demo are fake and stay masked.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <LumenCard />
            <div className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
              <p className="font-medium">Demo profile</p>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd>Jordan Hale</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">One-time code</dt>
                  <dd className="font-medium tracking-wide">000000</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reserve</dt>
                  <dd>···· 4419</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Desk password</dt>
                  <dd>lumen-demo</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {steps.map((step) => (
            <article key={step.n} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs tracking-[0.18em] text-muted-foreground">{step.n}</p>
              <h2 className="mt-2 font-display text-2xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-3xl">Under the hood</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            One core agent serves the site chat, the embeddable widget, WhatsApp, and Messenger. With no API key it
            stays on a deterministic demo engine. Groq is first when <code>GROQ_API_KEY</code> is set, then Gemini.
          </p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
            {["Chat, widget, WhatsApp, Messenger", "Core agent", "BM25 + local embeddings", "Mock core tools", "Agent desk"].map(
              (label) => (
                <div key={label} className="rounded-2xl border border-border bg-card px-3 py-4 text-center">
                  {label}
                </div>
              ),
            )}
          </div>
          <p className="mt-4 text-sm">
            <Link href="/embed-demo" className="underline-offset-4 hover:underline">
              See the widget on a sample page
            </Link>
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-3xl">Ask the help center</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map(([label, prompt]) => (
              <Link
                key={label}
                href={`/chat?ask=${encodeURIComponent(prompt)}`}
                className="rounded-2xl border border-border bg-card px-4 py-4 hover:bg-accent"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                <p className="mt-2 text-sm">{prompt}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">
        Portfolio demo by Quvantic - fictional brand, not a real business / not client work
      </footer>
    </div>
  );
}
