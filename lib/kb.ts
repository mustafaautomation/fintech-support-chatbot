import fs from "node:fs";
import path from "node:path";

export type Article = {
  slug: string;
  title: string;
  body: string;
};

export type Chunk = {
  slug: string;
  title: string;
  heading: string;
  text: string;
};

export type Hit = Chunk & { score: number; embedding: number; hybrid: number; specific: number };

const STOP = new Set(
  "a an the is are was were be to of and or for on in my me i you your we our it this that with from by at as if do does how what when can please about into over explain long take apply run spot tell".split(
    " ",
  ),
);

const KB_DIR = path.join(process.cwd(), "kb");
const EMBED_DIM = 128;

let cache: { articles: Article[]; chunks: Chunk[] } | null = null;

export function loadKnowledge() {
  if (cache && cache.articles.length) return cache;
  const files = fs
    .readdirSync(/*turbopackIgnore: true*/ KB_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort();
  const articles: Article[] = files.map((file) => {
    const raw = fs.readFileSync(/*turbopackIgnore: true*/ path.join(KB_DIR, file), "utf8");
    const slug = file.replace(/\.md$/, "");
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? slug;
    return { slug, title, body: raw.trim() };
  });
  const chunks = articles.flatMap(chunkArticle);
  cache = { articles, chunks };
  return cache;
}

export function resetKnowledgeCache() {
  cache = null;
}

function chunkArticle(article: Article): Chunk[] {
  const sections = article.body.split(/\n(?=##\s+)/);
  return sections.map((section) => {
    const heading = section.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim() ?? article.title;
    const text = section
      .replace(/^#+\s+.+\n/, "")
      .replace(/\s+/g, " ")
      .trim();
    return { slug: article.slug, title: article.title, heading, text };
  });
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP.has(term));
}

function embed(terms: string[]) {
  const vector = new Float64Array(EMBED_DIM);
  for (const term of terms) {
    let hash = 2166136261;
    for (let i = 0; i < term.length; i += 1) {
      hash = Math.imul(hash ^ term.charCodeAt(i), 16777619);
    }
    const index = Math.abs(hash) % EMBED_DIM;
    vector[index] += hash & 1 ? 1 : -1;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < EMBED_DIM; i += 1) vector[i] /= norm;
  return vector;
}

function cosine(left: Float64Array, right: Float64Array) {
  let dot = 0;
  for (let i = 0; i < EMBED_DIM; i += 1) dot += left[i] * right[i];
  return dot;
}

export function searchKb(query: string, limit = 3): Hit[] {
  const { chunks } = loadKnowledge();
  const q = tokens(query);
  if (!q.length) return [];
  const docs = chunks.map((chunk) => tokens(`${chunk.title} ${chunk.heading} ${chunk.text}`));
  const vectors = docs.map((doc) => embed(doc));
  const queryVector = embed(q);
  const N = docs.length;
  const avgdl = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(N, 1);
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const scored = chunks.map((chunk, index) => {
    const doc = docs[index] ?? [];
    const tf = new Map<string, number>();
    for (const term of doc) tf.set(term, (tf.get(term) ?? 0) + 1);
    let score = 0;
    const k1 = 1.2;
    const b = 0.75;
    const titleTokens = new Set(tokens(`${chunk.title} ${chunk.heading}`));
    let specific = 0;
    for (const term of new Set(q)) {
      const f = tf.get(term) ?? 0;
      if (!f && !titleTokens.has(term)) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const common = n / N > 0.4;
      if (f) {
        const gained = (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + b * doc.length / avgdl));
        score += gained;
        if (!common) specific += gained;
      }
      if (titleTokens.has(term)) {
        score += idf * 1.4;
        if (!common) specific += idf * 1.4;
      }
    }
    const embedding = cosine(queryVector, vectors[index] ?? queryVector);
    const hybrid = score / (score + 1) * 0.7 + Math.max(embedding, 0) * 0.3;
    return { ...chunk, score, embedding, hybrid, specific };
  });
  return scored
    .filter((hit) => hit.score > 0 || hit.embedding > 0.2)
    .sort((a, b) => b.score - a.score || b.embedding - a.embedding)
    .slice(0, limit);
}
