import { createSession, getDemoState, getSession } from "@/lib/demo";
import { respondWithEngine } from "@/lib/turn";

function phaseFor(tools: { name: string }[] | undefined) {
  const names = tools?.map((tool) => tool.name) ?? [];
  if (names.includes("escalate_to_agent")) return "Connecting you to a team member…";
  if (names.includes("open_dispute")) return "Opening the dispute…";
  if (names.includes("get_recent_transactions")) return "Retrieving recent charges…";
  if (names.includes("freeze_card") || names.includes("unfreeze_card") || names.includes("report_lost_card")) {
    return "Checking the card…";
  }
  if (names.includes("verify_identity")) return "Checking the one-time code…";
  return "Looking in the help center…";
}

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
    const { session: publicSession, engine } = await respondWithEngine(state, session.id, message);
    if (body?.stream === true) {
      const last = [...publicSession.messages].reverse().find((item) => item.role !== "user");
      const words = (last?.text ?? "").split(/(\s+)/);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: unknown) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };
          send("phase", { text: phaseFor(last?.tools) });
          await new Promise((resolve) => setTimeout(resolve, 160));
          const started = Date.now();
          let pending = "";
          for (let index = 0; index < words.length; index += 1) {
            if (request.signal.aborted) break;
            pending += words[index];
            const elapsed = Date.now() - started;
            const lastWord = index === words.length - 1;
            if (pending.length < 14 && !lastWord && elapsed < 560) continue;
            send("token", { text: pending });
            pending = "";
            if (elapsed > 560 && !lastWord) {
              send("token", { text: words.slice(index + 1).join("") });
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          send("done", { session: publicSession, engine });
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
      });
    }
    return Response.json({ session: publicSession, engine });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The assistant hit a problem. Try that message again." }, { status: 500 });
  }
}