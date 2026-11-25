import { isDeskAuthorized } from "@/lib/desk-auth";

export function requireDesk(request: Request) {
  if (!isDeskAuthorized(request.headers.get("cookie"))) {
    return Response.json({ error: "Sign in to the agent desk." }, { status: 401 });
  }
  return null;
}
