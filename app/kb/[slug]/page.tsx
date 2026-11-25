import fs from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PortfolioDisclaimer } from "@/components/portfolio-disclaimer";

export function generateStaticParams() {
  const dir = path.join(process.cwd(), "kb");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ slug: file.replace(/\.md$/, "") }));
}

export default function KbPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Opening the article…</p>}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
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
