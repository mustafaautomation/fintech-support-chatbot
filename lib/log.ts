import { maskSensitive } from "@/lib/mask";

const lines: string[] = [];

export function logSafe(event: string, detail: unknown) {
  const body = typeof detail === "string" ? detail : JSON.stringify(detail);
  const line = maskSensitive(`${event} ${body}`);
  lines.push(line);
  console.info(line);
  return line;
}

export function recentLogs() {
  return lines;
}
