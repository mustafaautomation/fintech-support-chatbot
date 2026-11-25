import Script from "next/script";

export default function EmbedDemoPage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border px-6 py-4">
        <p className="font-display text-2xl">Halden Market</p>
        <p className="text-sm text-muted-foreground">A sample shop using the Lumen support widget.</p>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-4xl">Weekend ceramics</h1>
        <p className="mt-3 text-muted-foreground">
          This page is not Lumen. The chat bubble in the corner is the same assistant, loaded with one script tag.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-2xl bg-card p-4 text-sm">{`<script src="https://fintech-chat.quvantic.com/widget.js" data-endpoint="https://fintech-chat.quvantic.com"></script>`}</pre>
      </main>
      <footer className="px-6 py-6 text-sm text-muted-foreground">
        Portfolio demo by Quvantic - fictional brand, not a real business / not client work
      </footer>
      <Script src="/widget.js" strategy="afterInteractive" />
    </div>
  );
}
