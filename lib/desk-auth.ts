import { createHmac, timingSafeEqual } from "node:crypto";

export const DESK_COOKIE = "lumen_desk";
export const DESK_PASSWORD = process.env.AGENT_DESK_PASSWORD || "lumen-demo";

function secret() {
  return process.env.DESK_SECRET || "lumen-demo-desk-secret";
}

export function deskToken() {
  return createHmac("sha256", secret()).update("lumen-agent-desk").digest("hex");
}

export function passwordsMatch(input: string, expected: string) {
  const left = Buffer.from(input);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function deskCookieHeader() {
  return `${DESK_COOKIE}=${deskToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`;
}

export function clearDeskCookieHeader() {
  return `${DESK_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isDeskAuthorized(cookieHeader: string | null) {
  if (!cookieHeader) return false;
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DESK_COOKIE}=`));
  if (!pair) return false;
  const value = pair.slice(DESK_COOKIE.length + 1);
  return passwordsMatch(value, deskToken());
}
