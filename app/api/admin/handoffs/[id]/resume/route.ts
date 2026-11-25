import { getDemoState, resumeBot } from "@/lib/demo";
import { requireDesk } from "@/lib/admin-guard";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireDesk(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const session = resumeBot(getDemoState(), id);
  if (!session) return Response.json({ error: "That handoff is not on the desk." }, { status: 404 });
  return Response.json({ session });
}