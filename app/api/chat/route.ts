import { createSession, getDemoState, getSession } from "@/lib/demo";
import { respond } from "@/lib/turn";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    sessionId?: unknown;
    message?: unknown;
    stream?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.slice(0, 2000) : "";
  if (!message.trim()) {
    return Response.json({ error: "Enter a message first." }, { status: 400 });
  }
  const state = getDemoState();
  const existing = typeof body?.sessionId === "string" ? getSession(state, body.sessionId) : undefined;
  const session = existing ?? createSession(state);
  try {
    const publicSession = await respond(state, session.id, message);
    if (body?.stream === true) {
      const last = [...publicSession.messages].reverse().find((item) => item.role !== "user");
      const words = (last?.text ?? "").split(/(\s+)/);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          for (const word of words) {
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ text: word })}\n\n`));
          }
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ session: publicSession })}\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
      });
    }
    return Response.json({ session: publicSession });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The assistant hit a problem. Try that message again." }, { status: 500 });
  }
}
