import { DESK_PASSWORD, deskCookieHeader, passwordsMatch } from "@/lib/desk-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!passwordsMatch(password, DESK_PASSWORD)) {
    return Response.json({ error: "That desk password is not the demo password." }, { status: 401 });
  }
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": deskCookieHeader() } },
  );
}
