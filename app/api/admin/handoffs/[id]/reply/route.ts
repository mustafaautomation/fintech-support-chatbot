import { getDemoState, postAgentReply } from "@/lib/demo";
import { requireDesk } from "@/lib/admin-guard";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireDesk(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await request.json().catch(() => null)) as { text?: unknown; agentName?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.slice(0, 2000).trim() : "";
  if (!text) return Response.json({ error: "Write a reply first." }, { status: 400 });
  const agentName = typeof body?.agentName === "string" && body.agentName.trim() ? body.agentName.trim().slice(0, 80) : "Alex Rivera";
  const session = postAgentReply(getDemoState(), id, text, agentName);
  if (!session) return Response.json({ error: "That handoff is not on the desk." }, { status: 404 });
  return Response.json({ session });
}
