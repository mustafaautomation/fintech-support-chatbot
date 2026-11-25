import { getDemoState, getSession, toPublicSession } from "@/lib/demo";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const state = getDemoState();
  const session = getSession(state, id);
  if (!session) return Response.json({ error: "That chat is no longer on this server." }, { status: 404 });
  return Response.json({ session: toPublicSession(session, state) });
}
