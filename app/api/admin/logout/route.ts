import { clearDeskCookieHeader } from "@/lib/desk-auth";

export async function POST() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearDeskCookieHeader() } });
}
