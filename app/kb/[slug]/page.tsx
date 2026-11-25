import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";

export default async function KbPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const file = path.join(process.cwd(), "kb", `${slug}.md`);
  if (!fs.existsSync(file)) notFound();
  const text = fs.readFileSync(file, "utf8");
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <article className="whitespace-pre-wrap text-[15px] leading-7">{text}</article>
      <PortfolioDisclaimer className="mt-8 text-sm text-muted-foreground" />
    </main>
  );
}
