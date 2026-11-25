import { getDemoState, runPolicyTurn, sessionForExternal, type DemoState } from "@/lib/demo";
import { logSafe } from "@/lib/log";
import { maskSensitive } from "@/lib/mask";

export const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "lumen-verify";
export const MESSENGER_VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || "lumen-verify";

export function verifyHub(url: URL, expected: string) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  if (mode === "subscribe" && token === expected) return { ok: true as const, challenge };
  return { ok: false as const, challenge: "" };
}

type Inbound = { externalId: string; text: string };

export function readWhatsAppMessage(body: unknown): Inbound | null {
  const root = body as {
    entry?: { changes?: { value?: { messages?: { from?: string; text?: { body?: string } }[] } }[] }[];
  };
  const message = root.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const text = message?.text?.body?.trim();
  const from = message?.from;
  if (!text || !from) return null;
  return { externalId: `whatsapp:${from}`, text: maskSensitive(text) };
}

export function readMessengerMessage(body: unknown): Inbound | null {
  const root = body as { entry?: { messaging?: { sender?: { id?: string }; message?: { text?: string } }[] }[] };
  const event = root.entry?.[0]?.messaging?.[0];
  const text = event?.message?.text?.trim();
  const from = event?.sender?.id;
  if (!text || !from) return null;
  return { externalId: `messenger:${from}`, text: maskSensitive(text) };
}

export function acceptChannelMessage(state: DemoState, inbound: Inbound) {
  logSafe("channel", inbound);
  const session = sessionForExternal(state, inbound.externalId);
  const pub = runPolicyTurn(state, session.id, inbound.text);
  const reply = [...pub.messages].reverse().find((message) => message.role !== "user");
  return {
    sessionId: pub.id,
    reply: reply?.text ?? "",
    handoffId: pub.handoff?.id,
  };
}

export function acceptChannelMessageLive(inbound: Inbound) {
  return acceptChannelMessage(getDemoState(), inbound);
}
