import fs from "node:fs";
import path from "node:path";
import { searchKb, type Hit } from "@/lib/kb";
import { logSafe } from "@/lib/log";
import { assertNoPan, maskSensitive } from "@/lib/mask";

export { SEEDED_PAN } from "@/lib/mask";

export const DEMO_CUSTOMER = {
  name: "Jordan Hale",
  email: "jordan.hale@example.com",
  otp: "000000",
  city: "Halden Bay",
};

export type Sentiment = "calm" | "neutral" | "frustrated" | "angry";
export type CardStatus = "active" | "frozen" | "lost";
export type Product = "reserve" | "everyday";

export type Transaction = {
  id: string;
  postedOn: string;
  merchant: string;
  detail: string;
  amountCents: number;
  last4: string;
  product: Product;
  foreign: boolean;
  fxFeeCents?: number;
  original?: string;
  category: string;
  disputable: boolean;
};

export type TimelineStep = {
  label: string;
  detail: string;
  state: "done" | "current" | "upcoming";
};

export type Dispute = {
  id: string;
  transactionId: string;
  merchant: string;
  amountCents: number;
  last4: string;
  product: Product;
  reason: string;
  reasonLabel: string;
  status: "received";
  openedAt: string;
  timeline: TimelineStep[];
};

export type Citation = {
  slug: string;
  title: string;
  heading: string;
  excerpt: string;
};

export type ToolTrace = {
  name: string;
  ok: boolean;
  summary: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  text: string;
  createdAt: string;
  citations?: Citation[];
  tools?: ToolTrace[];
  transactions?: Transaction[];
  dispute?: Dispute;
  agentName?: string;
};

export type Pending =
  | { type: "dispute"; utterance: string }
  | { type: "choose_dispute"; utterance: string }
  | { type: "transactions" }
  | { type: "freeze" }
  | { type: "unfreeze" }
  | { type: "lost" }
  | { type: "status"; caseId?: string }
  | { type: "profile" };

export type Account = {
  reserveLast4: string;
  everydayLast4: string;
  reserveStatus: CardStatus;
  everydayStatus: CardStatus;
  reserveLimitCents: number;
  everydayBalanceCents: number;
  points: number;
  autopay: string;
  replacement?: { orderId: string; etaBusinessDays: number; last4: string };
  transactions: Transaction[];
  disputes: Dispute[];
  nextCase: number;
  nextReplacement: number;
};

export type HandoffCategory = "fraud" | "complaint" | "legal" | "escalation";

export type Handoff = {
  id: string;
  sessionId: string;
  status: "waiting" | "active" | "resolved";
  category: HandoffCategory;
  reason: string;
  summary: string;
  sentiment: Sentiment;
  verified: boolean;
  createdAt: string;
  agentName?: string;
};

export type Session = {
  id: string;
  createdAt: string;
  verified: boolean;
  verifiedAt?: string;
  sentiment: Sentiment;
  mode: "bot" | "queue" | "agent" | "resolved";
  pending?: Pending;
  messages: ChatMessage[];
  account: Account;
  handoffId?: string;
  externalKey?: string;
};

export type DemoState = {
  sessions: Session[];
  handoffs: Handoff[];
  nextHandoff: number;
};

export type PublicHandoff = Omit<Handoff, never>;

export type PublicSession = {
  id: string;
  createdAt: string;
  verified: boolean;
  customerName: string;
  sentiment: Sentiment;
  mode: Session["mode"];
  card: {
    product: string;
    last4: string;
    status: CardStatus;
    limitCents: number;
  };
  everyday: {
    product: string;
    last4: string;
    status: CardStatus;
    balanceCents: number;
  };
  points: number;
  autopay: string;
  replacement?: Account["replacement"];
  disputes: Dispute[];
  messages: ChatMessage[];
  handoff?: Handoff;
};

type Listener = (sessionId: string) => void;

type Bag = { state: DemoState; listeners: Set<Listener> };

function storeFiles() {
  const tmp = path.join("/tmp", "lumen-runtime.json");
  if (process.env.VERCEL) return [tmp];
  return [path.join(process.cwd(), "data", "runtime.json"), tmp];
}

function bag(): Bag {
  const g = globalThis as typeof globalThis & { __lumen?: Bag };
  if (!g.__lumen) {
    g.__lumen = { state: readDisk() ?? seedState(), listeners: new Set() };
  }
  return g.__lumen;
}

export function getDemoState() {
  return bag().state;
}

export function subscribe(listener: Listener) {
  bag().listeners.add(listener);
  return () => bag().listeners.delete(listener);
}

export function commitSession(state: DemoState, sessionId: string) {
  touch(state, sessionId);
}

function touch(state: DemoState, sessionId: string) {
  if (state !== bag().state) return;
  persist(state);
  for (const listener of bag().listeners) listener(sessionId);
}

function persist(state: DemoState) {
  const body = JSON.stringify(state);
  for (const file of storeFiles()) {
    try {
      fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
      fs.writeFileSync(/*turbopackIgnore: true*/ file, body);
      return;
    } catch {
      // The deployment filesystem is read-only. The in-memory seed still serves the demo.
    }
  }
}

function readDisk(): DemoState | null {
  for (const file of storeFiles()) {
    try {
      return JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as DemoState;
    } catch {
      // Missing file or unreadable path. Fall through to the seed.
    }
  }
  return null;
}

export function resetDemoState() {
  const fresh = seedState();
  bag().state = fresh;
  persist(fresh);
  for (const listener of bag().listeners) listener("*");
  return fresh;
}

export function seedState(): DemoState {
  return { sessions: [], handoffs: [], nextHandoff: 1 };
}

function seedAccount(): Account {
  return {
    reserveLast4: "4419",
    everydayLast4: "8821",
    reserveStatus: "active",
    everydayStatus: "active",
    reserveLimitCents: 500_000,
    everydayBalanceCents: 84_216,
    points: 12_480,
    autopay: "Statement balance, drawn from Everyday ···8821 on the 20th",
    transactions: [
      txn("txn_1008", "2026-11-24", "Northwind Market", "Groceries", 6418, "reserve", false, "Groceries"),
      txn("txn_1007", "2026-11-23", "Night Market Electronics", "Online, card not present", 48620, "reserve", false, "Electronics"),
      txn("txn_1006", "2026-11-22", "Spotify", "Subscription", 1199, "reserve", false, "Digital"),
      txn(
        "txn_1005",
        "2026-11-21",
        "Mercado Libre",
        "Foreign purchase",
        4210,
        "reserve",
        true,
        "Shopping",
        63,
        "MXN 780.00",
      ),
      txn("txn_1004", "2026-11-20", "Lumen Autopay", "Statement payment", -22000, "reserve", false, "Payment", undefined, undefined, false),
      txn("txn_1003", "2026-11-18", "City Transit", "Tap ride", 275, "everyday", false, "Transit"),
      txn("txn_1002", "2026-11-17", "Harbor & Rye", "Coffee", 640, "reserve", false, "Dining"),
      txn("txn_1001", "2026-11-15", "Cedar Atlas Books", "Books", 2840, "reserve", false, "Shopping"),
    ],
    disputes: [],
    nextCase: 1,
    nextReplacement: 1,
  };
}

function txn(
  id: string,
  postedOn: string,
  merchant: string,
  detail: string,
  amountCents: number,
  product: Product,
  foreign: boolean,
  category: string,
  fxFeeCents?: number,
  original?: string,
  disputable = true,
): Transaction {
  return {
    id,
    postedOn,
    merchant,
    detail,
    amountCents,
    last4: product === "reserve" ? "4419" : "8821",
    product,
    foreign,
    fxFeeCents,
    original,
    category,
    disputable,
  };
}

export function createSession(state: DemoState, externalKey?: string) {
  const session: Session = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    verified: false,
    sentiment: "neutral",
    mode: "bot",
    messages: [],
    account: seedAccount(),
    externalKey,
  };
  state.sessions.push(session);
  touch(state, session.id);
  return session;
}

export function getSession(state: DemoState, id: string) {
  return state.sessions.find((session) => session.id === id);
}

export function sessionForExternal(state: DemoState, externalKey: string) {
  const found = state.sessions.find((session) => session.externalKey === externalKey);
  if (found) return found;
  return createSession(state, externalKey);
}

export function money(cents: number) {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function say(session: Session, message: Omit<ChatMessage, "id" | "createdAt" | "role"> & { role?: ChatMessage["role"] }) {
  const text = maskSensitive(message.text);
  session.messages.push({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    role: message.role ?? "assistant",
    text,
    citations: message.citations,
    tools: message.tools,
    transactions: message.transactions,
    dispute: message.dispute,
    agentName: message.agentName,
  });
}

function rememberUser(session: Session, text: string) {
  const masked = maskSensitive(text.trim());
  session.sentiment = sentimentOf(masked);
  say(session, { role: "user", text: masked });
  return masked;
}

export function toPublicSession(session: Session, state: DemoState): PublicSession {
  const handoff = state.handoffs.find((item) => item.id === session.handoffId);
  const pub: PublicSession = {
    id: session.id,
    createdAt: session.createdAt,
    verified: session.verified,
    customerName: DEMO_CUSTOMER.name,
    sentiment: session.sentiment,
    mode: session.mode,
    card: {
      product: "Lumen Reserve",
      last4: session.account.reserveLast4,
      status: session.account.reserveStatus,
      limitCents: session.account.reserveLimitCents,
    },
    everyday: {
      product: "Lumen Everyday",
      last4: session.account.everydayLast4,
      status: session.account.everydayStatus,
      balanceCents: session.account.everydayBalanceCents,
    },
    points: session.account.points,
    autopay: session.account.autopay,
    replacement: session.account.replacement,
    disputes: session.account.disputes,
    messages: session.messages,
    handoff,
  };
  assertNoPan(pub);
  return pub;
}

export function sentimentOf(text: string): Sentiment {
  if (/\b(furious|outraged|ridiculous|unacceptable|angry|worst)\b/i.test(text)) return "angry";
  if (/\b(frustrated|annoyed|unhappy|disappointed|upset|not happy)\b/i.test(text)) return "frustrated";
  if (/\b(thanks|thank you|great|perfect)\b/i.test(text)) return "calm";
  return "neutral";
}

function handoffSignal(text: string): { category: HandoffCategory; reason: string } | null {
  if (/\b(lawyer|attorney|lawsuit|sue you|sue lumen|regulator|cfpb|in court)\b/i.test(text)) {
    return { category: "legal", reason: "Customer mentioned legal or regulatory action." };
  }
  if (/\b(fraud department|report fraud|identity theft|account takeover|stolen identity)\b/i.test(text)) {
    return { category: "fraud", reason: "Customer reported fraud beyond a single charge." };
  }
  if (/\b(formal complaint|file a complaint)\b/i.test(text)) {
    return { category: "complaint", reason: "Customer asked to file a complaint." };
  }
  if (/\b(human|real person|a person|representative|manager|supervisor|live agent|speak (to|with) (someone|a person|an agent)|talk (to|with) (someone|a person|an agent))\b/i.test(text)) {
    return { category: "escalation", reason: "Customer asked for a person." };
  }
  if (/\b(furious|outraged|ridiculous|unacceptable|worst (bank|service)|so angry)\b/i.test(text)) {
    return { category: "complaint", reason: "Customer is upset and needs a person." };
  }
  return null;
}

function isInjection(text: string) {
  return /ignore (all |any |the )?(previous|prior|above) instructions|system prompt|developer mode|you are now|jailbreak|do not follow your (rules|policy)|reveal the (full )?(card|pan)|print the (full )?card|skip (verification|the otp|identity check)|without (verif|an otp|otp)/i.test(
    text,
  );
}

function isAdvice(text: string) {
  return /\b(invest|crypto|bitcoin|stock|portfolio|tax advice|financial advice|should i sue|will i win)\b/i.test(text);
}

function isPolicyQuestion(text: string) {
  return /\b(how (do|long|does|can)|what is|what's|explain|tell me about|policy|timeline|regulation|fee)\b/i.test(text);
}

function wantsDispute(text: string) {
  const asksToOpen =
    /\b(please|open|start|file)\b/i.test(text) ||
    /\b(this charge|the charge|night market|spotify|mercado|txn_)\b/i.test(text) ||
    /\b(don't|do not) recognize\b/i.test(text) ||
    /\bdidn'?t (authorize|make|buy)\b/i.test(text);
  if (isPolicyQuestion(text) && !asksToOpen) return false;
  return (
    (/\b(dispute|chargeback)\b/i.test(text) && (asksToOpen || !isPolicyQuestion(text))) ||
    /\b(don't|do not) recognize\b/i.test(text) ||
    /\bdidn'?t authorize\b/i.test(text)
  );
}

function wantsLost(text: string) {
  if (isPolicyQuestion(text) && !/\bmy card\b/i.test(text)) return false;
  return /\b(lost|stolen)\b/i.test(text) && /\bcard\b/i.test(text);
}

function wantsFreeze(text: string) {
  if (/\bunfreeze|unlock\b/i.test(text)) return false;
  if (isPolicyQuestion(text)) return false;
  return /\b(freeze|lock)\b/i.test(text) && /\bcard\b/i.test(text);
}

function wantsUnfreeze(text: string) {
  if (isPolicyQuestion(text)) return false;
  return /\b(unfreeze|unlock)\b/i.test(text);
}

function wantsTransactions(text: string) {
  return /\b(my|recent|show|see|list)\b/i.test(text) && /\b(transaction|charge|purchase)s?\b/i.test(text);
}

function wantsStatus(text: string) {
  return (
    /\b(LZ-\d+|LE-\d+)\b/.test(text) ||
    (/\b(dispute|case|chargeback)\b/i.test(text) && /\b(status|update|progress|where)\b/i.test(text))
  );
}

function wantsProfile(text: string) {
  return /\b(my )(credit limit|limit|points|autopay|balance)\b/i.test(text) || /\bhow many points\b/i.test(text);
}

function extractOtp(text: string) {
  const match = text.match(/\b(\d{6})\b/);
  return match?.[1];
}

function nameMismatch(text: string) {
  const named = text.match(/\b(?:i am|i'm|this is|name is)\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (!named?.[1]) return false;
  const value = named[1].toLowerCase();
  return !value.includes("jordan") && !value.includes("hale");
}

function last4Mismatch(text: string) {
  const match = text.match(/\b(?:last\s*4|ending|card)\s*(?:is|in|:)?\s*(\d{4})\b/i);
  if (!match?.[1]) return false;
  return match[1] !== "4419" && match[1] !== "8821";
}

export type ToolResult = {
  ok: boolean;
  code?: "needs_verification" | "invalid_otp" | "not_found" | "conflict" | "refused";
  summary: string;
  transactions?: Transaction[];
  dispute?: Dispute;
};

function requireVerified(session: Session): ToolResult | null {
  if (session.verified) return null;
  return {
    ok: false,
    code: "needs_verification",
    summary: "Identity is not verified. Ask for the one-time code before any account action.",
  };
}

export function verifyIdentity(session: Session, otp: string, utterance = ""): ToolResult {
  if (otp !== DEMO_CUSTOMER.otp || nameMismatch(utterance) || last4Mismatch(utterance)) {
    return {
      ok: false,
      code: "invalid_otp",
      summary: "The one-time code, name, or last four did not match the demo profile.",
    };
  }
  session.verified = true;
  session.verifiedAt = new Date().toISOString();
  return { ok: true, summary: `Verified ${DEMO_CUSTOMER.name} with the demo one-time code.` };
}

export function getRecentTransactions(session: Session, limit = 8): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  const transactions = session.account.transactions.slice(0, limit);
  return {
    ok: true,
    summary: `Returned ${transactions.length} recent transactions. Cards are masked.`,
    transactions,
  };
}

export function freezeCard(session: Session): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  if (session.account.reserveStatus === "lost") {
    return {
      ok: false,
      code: "conflict",
      summary: "Reserve is already frozen because it was reported lost.",
    };
  }
  session.account.reserveStatus = "frozen";
  return { ok: true, summary: "Froze Lumen Reserve ···4419." };
}

export function unfreezeCard(session: Session): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  if (session.account.reserveStatus === "lost") {
    return {
      ok: false,
      code: "conflict",
      summary: "A lost card cannot be unfrozen. The replacement has to be activated.",
    };
  }
  if (session.account.reserveStatus === "active") {
    return { ok: true, summary: "Lumen Reserve ···4419 is already active." };
  }
  session.account.reserveStatus = "active";
  return { ok: true, summary: "Unfroze Lumen Reserve ···4419." };
}

export function reportLostCard(session: Session): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  session.account.reserveStatus = "lost";
  const orderId = `REP-${22040 + session.account.nextReplacement}`;
  session.account.nextReplacement += 1;
  session.account.replacement = { orderId, etaBusinessDays: 5, last4: "4419" };
  return {
    ok: true,
    summary: `Reported Reserve ···4419 lost. Replacement ${orderId} arrives in 5 business days. The card is frozen.`,
  };
}

const REASONS: { id: string; label: string; pattern: RegExp }[] = [
  { id: "duplicate", label: "Duplicate charge", pattern: /duplicate|charged twice|twice/i },
  { id: "cancelled", label: "Cancelled or refund missing", pattern: /cancel+ed|refund/i },
  { id: "incorrect_amount", label: "Incorrect amount", pattern: /wrong amount|incorrect amount|overcharg/i },
  { id: "not_received", label: "Goods or services not received", pattern: /not received|never arrived|didn't arrive|did not arrive|not delivered/i },
  { id: "unrecognized", label: "Unrecognized or unauthorized", pattern: /don't recognize|do not recognize|didn't authorize|did not authorize|unauthorized|not mine|never bought/i },
];

function reasonFrom(text: string) {
  return REASONS.find((reason) => reason.pattern.test(text)) ?? REASONS[4];
}

function findTransaction(account: Account, text: string) {
  const id = text.match(/txn_\d+/i)?.[0]?.toLowerCase();
  if (id) {
    const exact = account.transactions.find((item) => item.id === id);
    return exact ? { match: exact } : { match: undefined, missingId: id };
  }
  const amount = text.match(/\$?\b(\d{1,4})(?:\.(\d{2}))?\b/);
  const wantedCents = amount
    ? amount[2]
      ? Number(amount[1]) * 100 + Number(amount[2])
      : Number(amount[1]) * 100
    : undefined;
  const words = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
  const ranked = account.transactions
    .map((item) => {
      const merchantWords = item.merchant.toLowerCase().split(/\s+/);
      let score = merchantWords.filter((word) => words.has(word)).length;
      if (wantedCents !== undefined && Math.abs(item.amountCents) === wantedCents) score += 3;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return { match: undefined };
  if (ranked.length > 1 && ranked[0].score === ranked[1].score) return { ambiguous: true as const };
  return { match: ranked[0].item };
}

export function openDispute(session: Session, transactionId: string, utterance: string): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  const transaction = session.account.transactions.find((item) => item.id === transactionId);
  if (!transaction) {
    return { ok: false, code: "not_found", summary: `No transaction ${transactionId}.` };
  }
  if (!transaction.disputable) {
    return {
      ok: false,
      code: "refused",
      summary: `${transaction.merchant} is a payment, not a purchase. Payments are not opened as billing-error cases.`,
    };
  }
  const existing = session.account.disputes.find((item) => item.transactionId === transaction.id);
  if (existing) {
    return {
      ok: true,
      summary: `Case ${existing.id} is already open for ${transaction.merchant}.`,
      dispute: existing,
    };
  }
  const reason = reasonFrom(utterance);
  const prefix = transaction.product === "reserve" ? "LZ" : "LE";
  const id = `${prefix}-${48000 + session.account.nextCase}`;
  session.account.nextCase += 1;
  const dispute: Dispute = {
    id,
    transactionId: transaction.id,
    merchant: transaction.merchant,
    amountCents: transaction.amountCents,
    last4: transaction.last4,
    product: transaction.product,
    reason: reason.id,
    reasonLabel: reason.label,
    status: "received",
    openedAt: new Date().toISOString(),
    timeline: timelineFor(transaction.product),
  };
  session.account.disputes.unshift(dispute);
  return {
    ok: true,
    summary: `Opened ${dispute.id} for ${transaction.merchant} ${money(transaction.amountCents)}.`,
    dispute,
  };
}

function timelineFor(product: Product): TimelineStep[] {
  if (product === "everyday") {
    return [
      { label: "Case opened", detail: "We logged the error notice on the Everyday debit card.", state: "done" },
      {
        label: "Investigation",
        detail: "Fictional Regulation E-style policy: we aim to finish within 10 business days.",
        state: "current",
      },
      {
        label: "Provisional credit",
        detail: "If the review needs longer, we provisionally credit the amount while it stays open, up to 45 days.",
        state: "upcoming",
      },
    ];
  }
  return [
    { label: "Case opened", detail: "We logged the billing-error notice on Lumen Reserve.", state: "done" },
    {
      label: "Acknowledgement",
      detail: "Lumen targets 1 business day. The fictional Regulation Z-style policy allows up to 30 days for written acknowledgement.",
      state: "current",
    },
    {
      label: "Merchant inquiry",
      detail: "We ask the merchant for documents. You do not have to pay the disputed amount while it is open.",
      state: "upcoming",
    },
    {
      label: "Decision",
      detail: "Targeted within two billing cycles, and no later than 90 days. This is a process timeline, not an outcome.",
      state: "upcoming",
    },
  ];
}

export function getDisputeStatus(session: Session, caseId?: string): ToolResult {
  const blocked = requireVerified(session);
  if (blocked) return blocked;
  const dispute = caseId
    ? session.account.disputes.find((item) => item.id.toLowerCase() === caseId.toLowerCase())
    : session.account.disputes[0];
  if (!dispute) {
    return { ok: false, code: "not_found", summary: caseId ? `No case ${caseId}.` : "No dispute is open on this demo profile." };
  }
  return { ok: true, summary: `${dispute.id} is ${dispute.status.replaceAll("_", " ")}.`, dispute };
}

function summarize(session: Session) {
  const latest = session.messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.text);
  const cases = session.account.disputes.map((item) => item.id);
  return [
    session.verified ? `${DEMO_CUSTOMER.name} is verified with the demo code.` : `${DEMO_CUSTOMER.name} is not verified.`,
    `Reserve ···${session.account.reserveLast4} is ${session.account.reserveStatus}.`,
    cases.length ? `Open cases: ${cases.join(", ")}.` : "No dispute case yet.",
    `Sentiment on the latest message: ${session.sentiment}.`,
    latest.length ? `Customer: ${latest.join(" / ")}` : "No customer text yet.",
  ].join(" ");
}

export function escalateToAgent(
  state: DemoState,
  session: Session,
  category: HandoffCategory,
  reason: string,
): { handoff: Handoff; trace: ToolTrace } {
  const existing = state.handoffs.find((item) => item.id === session.handoffId && item.status !== "resolved");
  if (existing) {
    return {
      handoff: existing,
      trace: { name: "escalate_to_agent", ok: true, summary: `Already with the desk as ${existing.id}.` },
    };
  }
  const handoff: Handoff = {
    id: `H-${1000 + state.nextHandoff}`,
    sessionId: session.id,
    status: "waiting",
    category,
    reason,
    summary: summarize(session),
    sentiment: session.sentiment,
    verified: session.verified,
    createdAt: new Date().toISOString(),
  };
  state.nextHandoff += 1;
  state.handoffs.unshift(handoff);
  session.handoffId = handoff.id;
  session.mode = "queue";
  session.pending = undefined;
  return {
    handoff,
    trace: {
      name: "escalate_to_agent",
      ok: true,
      summary: `Warm handoff ${handoff.id}. Verified: ${handoff.verified ? "yes" : "no"}. Sentiment: ${handoff.sentiment}.`,
    },
  };
}

export function postAgentReply(state: DemoState, handoffId: string, text: string, agentName = "Alex Rivera") {
  const handoff = state.handoffs.find((item) => item.id === handoffId);
  if (!handoff) return null;
  const session = getSession(state, handoff.sessionId);
  if (!session) return null;
  handoff.status = "active";
  handoff.agentName = agentName;
  session.mode = "agent";
  say(session, { role: "agent", text: maskSensitive(text), agentName });
  touch(state, session.id);
  return toPublicSession(session, state);
}

export function resolveHandoff(state: DemoState, handoffId: string) {
  const handoff = state.handoffs.find((item) => item.id === handoffId);
  if (!handoff) return null;
  const session = getSession(state, handoff.sessionId);
  if (!session) return null;
  handoff.status = "resolved";
  session.mode = "bot";
  say(session, {
    role: "system",
    text: `${handoff.agentName ?? "The specialist"} marked this handoff resolved. I can keep helping from here.`,
  });
  touch(state, session.id);
  return toPublicSession(session, state);
}

type ActionPayload = {
  text: string;
  tools: ToolTrace[];
  transactions?: Transaction[];
  dispute?: Dispute;
  citations?: Citation[];
};

function trace(name: string, result: ToolResult): ToolTrace {
  return { name, ok: result.ok, summary: result.summary };
}

function describeTransactions(transactions: Transaction[]) {
  const lines = transactions.map((item) => {
    const fx = item.fxFeeCents ? ` plus ${money(item.fxFeeCents)} FX fee` : "";
    const origin = item.original ? ` (${item.original})` : "";
    return `${shortDate(item.postedOn)} · ${item.merchant} · ${money(item.amountCents)}${origin}${fx} · ${item.product === "reserve" ? "Reserve" : "Everyday"} ···· ${item.last4} · ${item.id}`;
  });
  return `Here are the recent posted lines on Jordan Hale's demo profile:\n${lines.join("\n")}`;
}

function describeDispute(dispute: Dispute, justVerified: boolean) {
  const lead = justVerified ? "You're verified, Jordan. " : "";
  const rule =
    dispute.product === "reserve"
      ? "The fictional Reserve policy follows a Regulation Z-style path: acknowledgement, a merchant inquiry, and a decision targeted within two billing cycles and no later than 90 days. You do not have to pay the disputed amount while it is open."
      : "The fictional Everyday policy follows a Regulation E-style path: a 10-business-day investigation, with provisional credit if it needs longer, up to 45 days.";
  return `${lead}I opened case ${dispute.id} for ${dispute.merchant} (${money(dispute.amountCents)}) on the card ending ${dispute.last4}. Reason on file: ${dispute.reasonLabel}. ${rule} This is the published process, not a prediction and not legal advice.`;
}

function profileText(session: Session, justVerified: boolean) {
  const lead = justVerified ? "You're verified, Jordan. " : "";
  return `${lead}Reserve ···${session.account.reserveLast4} is ${session.account.reserveStatus} with a $${(session.account.reserveLimitCents / 100).toFixed(0)} credit limit. Everyday ···${session.account.everydayLast4} shows ${money(session.account.everydayBalanceCents)}. Rewards: ${session.account.points.toLocaleString("en-US")} points. Autopay: ${session.account.autopay}. I can explain how points redeem, and I won't tell you whether to redeem or invest them.`;
}

function perform(session: Session, pending: Pending, justVerified: boolean): ActionPayload {
  if (pending.type === "transactions") {
    const result = getRecentTransactions(session);
    return {
      text: `${justVerified ? "You're verified, Jordan. " : ""}${describeTransactions(result.transactions ?? [])}`,
      tools: [trace("get_recent_transactions", result)],
      transactions: result.transactions,
    };
  }
  if (pending.type === "freeze") {
    const result = freezeCard(session);
    return {
      text: `${justVerified ? "You're verified, Jordan. " : ""}${result.summary} New purchases should decline. Recurring charges already authorized can still post. A freeze is not a lost-card report.`,
      tools: [trace("freeze_card", result)],
    };
  }
  if (pending.type === "unfreeze") {
    const result = unfreezeCard(session);
    return {
      text: `${justVerified ? "You're verified, Jordan. " : ""}${result.summary}`,
      tools: [trace("unfreeze_card", result)],
    };
  }
  if (pending.type === "lost") {
    const result = reportLostCard(session);
    return {
      text: `${justVerified ? "You're verified, Jordan. " : ""}${result.summary} Digital-wallet copies of ···4419 should be removed. If you see a charge you don't recognize, I can dispute that line next.`,
      tools: [trace("report_lost_card", result)],
    };
  }
  if (pending.type === "status") {
    const result = getDisputeStatus(session, pending.caseId);
    return {
      text: result.dispute
        ? `${result.summary} ${result.dispute.timeline.map((step) => `${step.label} (${step.state}): ${step.detail}`).join(" ")}`
        : result.summary,
      tools: [trace("get_dispute_status", result)],
      dispute: result.dispute,
    };
  }
  if (pending.type === "profile") {
    return {
      text: profileText(session, justVerified),
      tools: [{ name: "get_recent_transactions", ok: true, summary: "Read the demo profile limits, points, and autopay." }],
    };
  }
  return openDisputeFromUtterance(session, pending.utterance, justVerified);
}

function openDisputeFromUtterance(session: Session, utterance: string, justVerified: boolean): ActionPayload {
  const found = findTransaction(session.account, utterance);
  if (found.missingId) {
    return {
      text: `I can't find ${found.missingId} on this demo profile.`,
      tools: [{ name: "open_dispute", ok: false, summary: `No transaction ${found.missingId}.` }],
    };
  }
  if (!found.match || found.ambiguous) {
    session.pending = { type: "choose_dispute", utterance };
    const lines = session.account.transactions
      .filter((item) => item.disputable)
      .map((item) => `${item.id} · ${item.merchant} · ${money(item.amountCents)}`);
    return {
      text: `${justVerified ? "You're verified, Jordan. " : ""}Which posted line should I open? ${lines.join("; ")}.`,
      tools: [{ name: "open_dispute", ok: false, summary: "Need a specific transaction before opening a case." }],
    };
  }
  const result = openDispute(session, found.match.id, utterance);
  session.pending = undefined;
  if (!result.ok || !result.dispute) {
    return { text: result.summary, tools: [trace("open_dispute", result)] };
  }
  return {
    text: describeDispute(result.dispute, justVerified),
    tools: [trace("open_dispute", result)],
    dispute: result.dispute,
  };
}

function citationsFrom(hits: Hit[]): Citation[] {
  return hits.slice(0, 2).map((hit) => ({
    slug: hit.slug,
    title: hit.title,
    heading: hit.heading,
    excerpt: hit.text.slice(0, 280),
  }));
}

const DOMAIN =
  /\b(lumen|card|fee|fees|dispute|chargeback|freeze|unfreeze|reward|points|autopay|transaction|charge|kyc|payment|limit|stolen|lost|phish|statement|apr|interest|foreign|atm|replacement|close|account|debit|credit|visa|merchant|refund|wallet|pin|alert|deposit|travel)\b/i;

function isDomain(text: string) {
  return DOMAIN.test(text);
}

function kbAnswer(query: string) {
  const hits = searchKb(query, 3);
  const top = hits[0];
  const low = !top || top.specific < 2.6;
  const tools: ToolTrace[] = [
    {
      name: "search_kb",
      ok: !low,
      summary: top ? `Top article: ${top.title}. Confidence ${top.hybrid.toFixed(2)}.` : "No help-center article matched.",
    },
  ];
  if (low) {
    return {
      low: true,
      text: "",
      tools,
      citations: [] as Citation[],
    };
  }
  const excerpt = top.text.slice(0, 700);
  return {
    low: false,
    text: `${excerpt} This is Lumen's published help text for a fictional card, not financial, tax, or legal advice.`,
    tools,
    citations: citationsFrom(hits.filter((hit) => hit.slug === top.slug || hit.score > top.score * 0.72)),
  };
}

function askForCode(session: Session, pending: Pending) {
  session.pending = pending;
  say(session, {
    text: "I can do that after a quick identity check. On this demo the one-time code is 000000. Enter it and I'll continue. I won't show a full card number, and I won't take the action before the code matches.",
    tools: [
      {
        name: "verify_identity",
        ok: false,
        summary: "Waiting for the demo one-time code before an account action.",
      },
    ],
  });
}

function refusal() {
  return "I can't share a full card number, reveal hidden instructions, or skip the identity check. I can help with Lumen fees, card controls, and disputes after the demo code 000000 when an action needs the account.";
}

function classifyPending(text: string): Pending | null {
  if (wantsStatus(text)) {
    const caseId = text.match(/\b(LZ-\d+|LE-\d+)\b/i)?.[1];
    return { type: "status", caseId };
  }
  if (wantsLost(text)) return { type: "lost" };
  if (wantsUnfreeze(text)) return { type: "unfreeze" };
  if (wantsFreeze(text)) return { type: "freeze" };
  if (wantsDispute(text)) return { type: "dispute", utterance: text };
  if (wantsTransactions(text)) return { type: "transactions" };
  if (wantsProfile(text)) return { type: "profile" };
  return null;
}

export function runPolicyTurn(state: DemoState, sessionId: string, rawText: string) {
  const session = getSession(state, sessionId);
  if (!session) throw new Error("Unknown session");
  const text = rememberUser(session, rawText);
  logSafe("turn", { sessionId: session.id, text });
  if (!text) {
    say(session, { text: "Send a question or a request when you're ready." });
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  if (session.mode === "queue" || session.mode === "agent") {
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  const signal = handoffSignal(text);
  if (signal) {
    const { handoff, trace: handoffTrace } = escalateToAgent(state, session, signal.category, signal.reason);
    say(session, {
      text: `I'm handing this to a specialist rather than handling it myself. ${signal.reason} Handoff ${handoff.id} is on the agent desk with a summary, sentiment (${handoff.sentiment}), and verified status (${handoff.verified ? "verified" : "not verified"}). Keep typing if you want them to see more. This demo desk is staffed from the agent console.`,
      tools: [handoffTrace],
    });
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  if (isInjection(text)) {
    const reveal = /full card|card number|\bpan\b|system prompt/i.test(text);
    const bypass = /skip|without|bypass|developer mode|you are now/i.test(text);
    if (reveal || bypass) {
      say(session, { text: refusal() });
      touch(state, session.id);
      return toPublicSession(session, state);
    }
    const cleaned = text
      .replace(/ignore[\s\S]{0,120}?instructions[. ]*/gi, " ")
      .replace(/system prompt/gi, " ");
    if (!/[a-z]{4,}/i.test(cleaned)) {
      say(session, { text: refusal() });
      touch(state, session.id);
      return toPublicSession(session, state);
    }
    return continueTurn(state, session, cleaned);
  }

  return continueTurn(state, session, text);
}

function continueTurn(state: DemoState, session: Session, text: string) {
  if (isAdvice(text)) {
    const kb = kbAnswer(text);
    say(session, {
      text: `I can't give financial, tax, or legal advice, and I won't recommend investing rewards or predict a dispute. ${kb.citations.length ? kb.text : "I can explain published fees, redemption math, and dispute steps."}`,
      tools: kb.tools,
      citations: kb.citations,
    });
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  const otp = extractOtp(text);
  if (otp) {
    const result = verifyIdentity(session, otp, text);
    if (!result.ok) {
      say(session, {
        text: "That didn't match the demo profile. Use code 000000 for Jordan Hale. If you also type a name or last four, they need to match Jordan Hale and 4419 or 8821.",
        tools: [trace("verify_identity", result)],
      });
      touch(state, session.id);
      return toPublicSession(session, state);
    }
    const pending = session.pending;
    session.pending = undefined;
    const verifyTrace = trace("verify_identity", result);
    if (pending) {
      const action = perform(session, pending, true);
      say(session, { ...action, tools: [verifyTrace, ...action.tools] });
    } else {
      const next = classifyPending(text);
      if (next && next.type !== "status") {
        const action = perform(session, next, true);
        say(session, { ...action, tools: [verifyTrace, ...action.tools] });
      } else {
        say(session, {
          text: "You're verified, Jordan. I can show recent transactions, freeze or unfreeze Reserve ···4419, report it lost, or open a dispute. What should I do?",
          tools: [verifyTrace],
        });
      }
    }
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  if (session.pending?.type === "choose_dispute" && session.verified) {
    const action = openDisputeFromUtterance(session, text, false);
    say(session, action);
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  const pending = classifyPending(text);
  if (pending) {
    if (!session.verified) {
      askForCode(session, pending);
      touch(state, session.id);
      return toPublicSession(session, state);
    }
    const action = perform(session, pending, false);
    say(session, action);
    touch(state, session.id);
    return toPublicSession(session, state);
  }

  const kb = kbAnswer(text);
  if (kb.low) {
    if (isDomain(text)) {
      const { handoff, trace: handoffTrace } = escalateToAgent(
        state,
        session,
        "escalation",
        "Retrieval confidence was too low to answer from the help center.",
      );
      say(session, {
        text: `I don't know that from the Lumen help center, so I'm handing you to a specialist rather than guessing. Handoff ${handoff.id} includes the conversation summary. Verified status: ${handoff.verified ? "verified" : "not verified"}.`,
        tools: [...kb.tools, handoffTrace],
      });
    } else {
      say(session, {
        text: "That's outside Lumen Card support. I can help with fees, limits, freezing, lost cards, disputes, foreign purchases, rewards, autopay, identity checks, account closure, and security.",
        tools: kb.tools,
      });
    }
    touch(state, session.id);
    return toPublicSession(session, state);
  }
  say(session, kb);
  touch(state, session.id);
  return toPublicSession(session, state);
}

export function rollbackTrailingUser(state: DemoState, sessionId: string, text: string) {
  const session = getSession(state, sessionId);
  if (!session) return;
  const last = session.messages.at(-1);
  if (last?.role === "user" && last.text === maskSensitive(text.trim())) {
    session.messages.pop();
  }
}
