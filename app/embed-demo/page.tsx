import Script from "next/script";
import { LumenCard } from "@/components/lumen-card";
import { OpsToast } from "@/components/ops-toast";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export default function EmbedDemoPage() {
  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border bg-accent-soft px-4 py-2 text-[13px]">
        <p>This is how the embed looks on a real site. The banner is not part of the host page.</p>
        <ThemeToggle />
      </div>
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-[15px] font-semibold">Lumen · {BRAND.city}</p>
          <p className="text-sm text-muted-foreground">Jordan Hale · Everyday and Reserve</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-6 md:grid-cols-[280px_1fr]">
        <LumenCard />
        <section>
          <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.03em]">November statement</h1>
          <p className="mt-3 max-w-xl text-[18px] leading-7 text-muted-foreground">
            Autopay draws the statement balance on the 20th. A charge you don&apos;t recognize can be filed from the
            corner chat without leaving this page.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Statement balance</dt>
              <dd className="font-mono-nums text-lg">$220.00</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rewards</dt>
              <dd className="font-mono-nums text-lg">12,480 pts</dd>
            </div>
          </dl>
        </section>
      </main>
      <footer className="px-6 py-8 text-sm text-muted-foreground">
        <PortfolioDisclaimer />
      </footer>
      <OpsToast />
      <Script src="/widget.js" data-instant="true" strategy="afterInteractive" />
    </div>
  );
}
