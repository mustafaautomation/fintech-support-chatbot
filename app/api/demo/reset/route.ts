import { resetDemoState } from "@/lib/demo";

export async function POST() {
  resetDemoState();
  return Response.json({ ok: true });
}
