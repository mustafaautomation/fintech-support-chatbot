import { getDemoState, toPublicSession } from "@/lib/demo";

export async function GET() {
  const state = getDemoState();
  const conversations = state.sessions.map((session) => toPublicSession(session, state));
  const tickets = state.sessions.flatMap((session) =>
    session.account.disputes.map((dispute) => ({ ...dispute, sessionId: session.id })),
  );
  const toolCalls = state.sessions.flatMap((session) =>
    session.messages.flatMap((message) =>
      (message.tools ?? []).map((tool) => ({
        sessionId: session.id,
        messageId: message.id,
        at: message.createdAt,
        ...tool,
      })),
    ),
  );
  return Response.json({
    conversations,
    handoffs: state.handoffs,
    tickets,
    toolCalls,
  });
}
