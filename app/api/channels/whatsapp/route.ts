import { readWhatsAppMessage, verifyHub, WHATSAPP_VERIFY_TOKEN } from "@/lib/channels";
import { getDemoState, sessionForExternal } from "@/lib/demo";
import { logSafe } from "@/lib/log";
import { respond } from "@/lib/turn";

export async function GET(request: Request) {
  const result = verifyHub(new URL(request.url), WHATSAPP_VERIFY_TOKEN);
  if (!result.ok) return new Response("forbidden", { status: 403 });
  return new Response(result.challenge, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  logSafe("whatsapp", body);
  const inbound = readWhatsAppMessage(body);
  if (!inbound) return Response.json({ ok: true, ignored: true });
  const state = getDemoState();
  const session = sessionForExternal(state, inbound.externalId);
  const pub = await respond(state, session.id, inbound.text);
  const reply = [...pub.messages].reverse().find((message) => message.role !== "user");
  return Response.json({ ok: true, channel: "whatsapp", sessionId: pub.id, reply: reply?.text ?? "" });
}
