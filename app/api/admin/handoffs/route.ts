import { getDemoState, getSession } from "@/lib/demo";
import { requireDesk } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const denied = requireDesk(request);
  if (denied) return denied;
  const state = getDemoState();
  const handoffs = state.handoffs.map((handoff) => {
    const session = getSession(state, handoff.sessionId);
    return {
      ...handoff,
      preview: session?.messages.filter((message) => message.role === "user").at(-1)?.text ?? "",
      cardStatus: session?.account.reserveStatus ?? "active",
      messages: session?.messages ?? [],
      disputes: session?.account.disputes ?? [],
      verified: session?.verified ?? handoff.verified,
    };
  });
  return Response.json({ handoffs });
}
