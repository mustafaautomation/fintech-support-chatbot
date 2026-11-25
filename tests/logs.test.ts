import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { logSafe } from "@/lib/log";
import { SEEDED_PAN } from "@/lib/mask";

describe("log masking", () => {
  it("does not write a full card number to the log line", () => {
    const line = logSafe("customer", { text: `card ${SEEDED_PAN}`, email: "jordan.hale@example.com" });
    expect(line).not.toContain(SEEDED_PAN);
    expect(line).toContain("···· 4419");
  });

  it("ships at least 15 help articles", () => {
    const files = fs.readdirSync(path.join(process.cwd(), "kb")).filter((name) => name.endsWith(".md"));
    expect(files.length).toBeGreaterThanOrEqual(15);
    expect(files.length).toBeLessThanOrEqual(30);
  });
});
