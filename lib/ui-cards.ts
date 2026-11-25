import { z } from "zod";
import type { ChatMessage, Dispute, Transaction } from "@/lib/demo";

function money(cents: number) {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const txnSchema = z.object({
  id: z.string(),
  merchant: z.string(),
  amount: z.string(),
  date: z.string(),
  last4: z.string(),
  product: z.string(),
});

const stepSchema = z.object({
  label: z.string(),
  detail: z.string(),
  state: z.enum(["done", "current", "upcoming"]),
});

export const richCardSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("transactions"), items: z.array(txnSchema).min(1) }),
  z.object({
    kind: z.literal("timeline"),
    id: z.string(),
    status: z.string(),
    steps: z.array(stepSchema).min(1),
  }),
  z.object({
    kind: z.literal("status"),
    product: z.string(),
    last4: z.string(),
    status: z.enum(["active", "frozen", "lost"]),
  }),
  z.object({
    kind: z.literal("fee"),
    title: z.string(),
    rows: z.array(z.object({ label: z.string(), amount: z.string() })).min(1),
    note: z.string(),
  }),
  z.object({
    kind: z.literal("form"),
    title: z.string(),
    subtitle: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
  }),
  z.object({
    kind: z.literal("confirm"),
    title: z.string(),
    code: z.string(),
    rows: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  }),
  z.object({
    kind: z.literal("handoff"),
    ticketId: z.string(),
    category: z.string(),
  }),
]);

export type RichCard = z.infer<typeof richCardSchema>;

const FEE_NOTE = "Sample range for this demo, not a bill.";

const FEE_BY_SLUG: Record<string, Extract<RichCard, { kind: "fee" }>> = {
  "card-fees": {
    kind: "fee",
    title: "Published fees",
    rows: [
      { label: "Annual fee", amount: "$0.00" },
      { label: "Monthly maintenance", amount: "$0.00" },
      { label: "Late fee, up to", amount: "$30.00" },
      { label: "Returned payment", amount: "$25.00" },
    ],
    note: FEE_NOTE,
  },
  "foreign-transactions": {
    kind: "fee",
    title: "Foreign transaction fee",
    rows: [
      { label: "Reserve", amount: "1.5%" },
      { label: "Everyday", amount: "1.0%" },
      { label: "$100 foreign purchase", amount: "$101.50" },
    ],
    note: FEE_NOTE,
  },
  "payments-autopay": {
    kind: "fee",
    title: "Payment summary",
    rows: [
      { label: "Autopay", amount: "Statement balance" },
      { label: "From", amount: "···· 8821" },
      { label: "Day", amount: "20th" },
      { label: "Late fee, up to", amount: "$30.00" },
    ],
    note: FEE_NOTE,
  },
};

function txnView(item: Transaction) {
  return {
    id: item.id,
    merchant: item.merchant,
    amount: money(item.amountCents),
    date: shortDate(item.postedOn),
    last4: item.last4,
    product: item.product === "reserve" ? "Reserve" : "Everyday",
  };
}

function disputeTxn(dispute: Dispute) {
  return {
    id: dispute.transactionId,
    merchant: dispute.merchant,
    amount: money(dispute.amountCents),
    date: shortDate(dispute.openedAt.slice(0, 10)),
    last4: dispute.last4,
    product: dispute.product === "reserve" ? "Reserve" : "Everyday",
  };
}

export function deriveCards(message: ChatMessage): RichCard[] {
  const cards: RichCard[] = [];
  if (message.transactions?.length) {
    cards.push({ kind: "transactions", items: message.transactions.map(txnView) });
  }
  if (message.dispute) {
    if (!message.transactions?.length) {
      cards.push({ kind: "transactions", items: [disputeTxn(message.dispute)] });
    }
    cards.push({
      kind: "timeline",
      id: message.dispute.id,
      status: "In review",
      steps: message.dispute.timeline,
    });
    cards.push({
      kind: "confirm",
      title: "Ticket opened",
      code: message.dispute.id,
      rows: [
        { label: "Merchant", value: message.dispute.merchant },
        { label: "Amount", value: money(message.dispute.amountCents) },
        { label: "Card", value: `···· ${message.dispute.last4}` },
        { label: "Reason", value: message.dispute.reasonLabel },
      ],
    });
  }
  const tools = message.tools ?? [];
  const ok = (name: string) => tools.some((tool) => tool.name === name && tool.ok);
  if (ok("freeze_card")) {
    cards.push({ kind: "status", product: "Lumen Reserve", last4: "4419", status: "frozen" });
  } else if (ok("unfreeze_card")) {
    cards.push({ kind: "status", product: "Lumen Reserve", last4: "4419", status: "active" });
  } else if (ok("report_lost_card")) {
    cards.push({ kind: "status", product: "Lumen Reserve", last4: "4419", status: "lost" });
  }
  for (const citation of message.citations ?? []) {
    const fee = FEE_BY_SLUG[citation.slug];
    if (fee && !cards.some((card) => card.kind === "fee" && card.title === fee.title)) cards.push(fee);
  }
  if (/Which posted line/i.test(message.text)) {
    const options = [...message.text.matchAll(/txn_\d+\s·\s([^·]+)\s·\s(\$[\d.]+)/g)].map((match, index) => ({
      id: `line-${index}`,
      label: `${match[1]?.trim()} ${match[2]?.trim()}`,
    }));
    if (options.length) {
      cards.push({
        kind: "form",
        title: "Which charge should I dispute?",
        subtitle: "Pick a posted line. This demo never asks for a full card number.",
        options,
      });
    }
  }
  if (tools.some((tool) => tool.name === "escalate_to_agent")) {
    const ticketId = message.text.match(/Handoff (H-\d+)/)?.[1] ?? "H-";
    const category = message.text.match(/sentiment \(([^)]+)\)/)?.[1] ?? "escalation";
    cards.push({ kind: "handoff", ticketId, category });
  }
  const parsed = z.array(richCardSchema).safeParse(cards);
  return parsed.success ? parsed.data : [];
}

export function asksForCode(message: ChatMessage) {
  return (message.tools ?? []).some((tool) => tool.name === "verify_identity" && !tool.ok) && message.text.includes("000000");
}

export const DISPUTE_REASONS = [
  { id: "unrecognized", label: "Don't recognize it" },
  { id: "duplicate", label: "Charged twice" },
  { id: "incorrect_amount", label: "Wrong amount" },
  { id: "not_received", label: "Not received" },
] as const;
