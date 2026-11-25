import { DESK_PASSWORD, isDeskAuthorized } from "@/lib/desk-auth";

export async function GET(request: Request) {
  if (!isDeskAuthorized(request.headers.get("cookie"))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  return Response.json({ ok: true, passwordHint: DESK_PASSWORD });
}
