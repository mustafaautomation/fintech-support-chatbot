export const BRAND = {
  name: "Lumen Card",
  bot: "Lumen support",
  desk: "Lumen desk",
  agent: "Alex Rivera",
  city: "Halden Bay",
  address: "18 Pier Street, Halden Bay",
  liveUrl: "https://fintech-chat.quvantic.com",
  repoUrl: "https://github.com/mustafaautomation/fintech-support-chatbot",
} as const;

export const NUDGES = [
  {
    label: "Dispute a charge",
    prompt: "I don't recognize the Night Market Electronics charge. Please dispute it.",
  },
  {
    label: "Card was declined",
    prompt: "My card was declined. Please lock my card.",
  },
] as const;

export const STARTERS = [
  {
    label: "I don't recognize a charge",
    prompt: "I don't recognize the Night Market Electronics charge. Please dispute it.",
    icon: "receipt",
  },
  {
    label: "When will my payment post?",
    prompt: "When will my payment post?",
    icon: "calendar",
  },
  {
    label: "Lock my card",
    prompt: "Lock my card",
    icon: "lock",
  },
  {
    label: "Talk to a specialist",
    prompt: "I want to speak with a person.",
    icon: "person",
  },
] as const;

export const GREETING =
  "I can look up a charge, explain a published fee, or lock Lumen Reserve. Fraud and complaints go straight to a specialist.";

export const PLACEHOLDER = "Ask about a charge, a payment, or a lock…";

export const METRICS = [
  { label: "KB guides", value: "21" },
  { label: "Evals in CI", value: "25" },
  { label: "Tools", value: "9" },
  { label: "Replies", value: "Seconds" },
] as const;

export const DISCLAIMER =
  "Portfolio demo by Quvantic - fictional brand, not a real business / not client work";

export const TEASER = "Don't recognize a charge? I can open a dispute.";

export const CALLBACK_DAY = "Thu, Nov 26";
export const CALLBACK_SLOTS = ["10:30 AM", "2:30 PM", "4:00 PM"] as const;

export const TRY_ASKING = [
  { label: "Annual fee", prompt: "What is the annual fee?" },
  { label: "Foreign fee", prompt: "What is the foreign transaction fee on Lumen Reserve?" },
  { label: "Lock my card", prompt: "Lock my card" },
  { label: "Talk to a specialist", prompt: "I want to speak with a person." },
] as const;

export function phaseForDraft(text: string) {
  if (/\b(person|specialist|human|fraud)\b/i.test(text)) return "Connecting you to a person…";
  if (/\b(dispute|recognize|chargeback)\b/i.test(text)) return "Reviewing the charge…";
  if (/\b(lock|freeze|unfreeze|stolen|lost)\b/i.test(text)) return "Checking the card…";
  if (/\b(transaction|charges)\b/i.test(text)) return "Retrieving recent charges…";
  if (/\b\d{6}\b/.test(text)) return "Checking the one-time code…";
  return "Looking in the help center…";
}
