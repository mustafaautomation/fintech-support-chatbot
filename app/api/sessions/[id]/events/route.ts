import { getDemoState, getSession, subscribe, toPublicSession } from "@/lib/demo";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const state = getDemoState();
  if (!getSession(state, id)) {
    return Response.json({ error: "Unknown session." }, { status: 404 });
  }

  let unsubscribe = () => {};
  let timer: ReturnType<typeof setInterval> | undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const currentState = getDemoState();
        const session = getSession(currentState, id);
        if (!session) return;
        const payload = JSON.stringify(toPublicSession(session, currentState));
        controller.enqueue(encoder.encode(`event: session\ndata: ${payload}\n\n`));
      };
      send();
      unsubscribe = subscribe((sessionId) => {
        if (sessionId === id || sessionId === "*") send();
      });
      timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          /* closed */
        }
      }, 15000);
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        if (timer) clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* closed */
        }
      });
    },
    cancel() {
      unsubscribe();
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
