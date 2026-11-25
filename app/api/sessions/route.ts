import { createSession, getDemoState, toPublicSession } from "@/lib/demo";

export async function POST() {
  const state = getDemoState();
  const session = createSession(state);
  return Response.json({ session: toPublicSession(session, state) });
}
