import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">Privacy</h1>
      <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
        This is a fictional Lumen Card demo. Messages stay in the server process for the life of that instance. Uploads
        stay in the browser. Do not type a real card number, password, or government id. No model key is shipped in the
        page.
      </p>
      <PortfolioDisclaimer className="mt-8 text-sm text-muted-foreground" />
    </main>
  );
}