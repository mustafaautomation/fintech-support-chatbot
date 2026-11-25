import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSession, getSession, runPolicyTurn, seedState } from "@/lib/demo";
import { SEEDED_PAN } from "@/lib/mask";
import cases from "../evals/cases.json";

type EvalCase = {
  id: string;
  turns: string[];
  textIncludes?: string[];
  textExcludes?: string[];
  citation?: string;
  tool?: string;
  caseId?: string;
  cardStatus?: "active" | "frozen" | "lost";
  notVerified?: boolean;
  noPan?: boolean;
  handoff?: string;
  sentiment?: string;
  mode?: string;
  noCase?: boolean;
};

type Row = { id: string; pass: boolean; detail: string };

function runCase(item: EvalCase) {
  const state = seedState();
  const session = createSession(state);
  for (const turn of item.turns) runPolicyTurn(state, session.id, turn);
  const current = getSession(state, session.id);
  if (!current) return { id: item.id, pass: false, detail: "missing session" };
  const reply = [...current.messages].reverse().find((message) => message.role === "assistant");
  const text = reply?.text ?? "";
  const problems: string[] = [];
  for (const needle of item.textIncludes ?? []) {
    if (!text.includes(needle)) problems.push(`missing "${needle}"`);
  }
  for (const needle of item.textExcludes ?? []) {
    if (text.toLowerCase().includes(needle)) problems.push(`unexpected "${needle}"`);
  }
  if (item.citation && !reply?.citations?.some((citation) => citation.slug === item.citation)) {
    problems.push(`citation ${item.citation}`);
  }
  if (item.tool && !reply?.tools?.some((tool) => tool.name === item.tool)) problems.push(`tool ${item.tool}`);
  if (item.caseId && current.account.disputes[0]?.id !== item.caseId) problems.push("case id");
  if (item.noCase && current.account.disputes.length) problems.push("unexpected case");
  if (item.cardStatus && current.account.reserveStatus !== item.cardStatus) problems.push("card status");
  if (item.notVerified && current.verified) problems.push("should not be verified");
  if (item.noPan && JSON.stringify(current.messages).includes(SEEDED_PAN)) problems.push("pan leaked");
  if (item.handoff && state.handoffs[0]?.category !== item.handoff) problems.push("handoff category");
  if (item.sentiment && state.handoffs[0]?.sentiment !== item.sentiment) problems.push("sentiment");
  if (item.mode && current.mode !== item.mode) problems.push(`mode ${current.mode}`);
  return { id: item.id, pass: problems.length === 0, detail: problems.join("; ") || "pass" };
}

describe("offline eval suite", () => {
  const rows = (cases as EvalCase[]).map(runCase);

  it("has at least 20 cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  it("writes the scorecard and passes every case", () => {
    const out = path.join(process.cwd(), "evals", "out");
    fs.mkdirSync(out, { recursive: true });
    const passed = rows.filter((row) => row.pass).length;
    const markdown = [
      "# Lumen eval scorecard",
      "",
      `Offline demo engine. ${passed}/${rows.length} passed.`,
      "",
      "| Case | Result | Detail |",
      "| --- | --- | --- |",
      ...rows.map((row) => `| ${row.id} | ${row.pass ? "pass" : "fail"} | ${row.detail.replaceAll("|", "/")} |`),
      "",
    ].join("\n");
    fs.writeFileSync(path.join(out, "scorecard.md"), markdown);
    fs.writeFileSync(path.join(out, "scorecard.json"), JSON.stringify({ passed, total: rows.length, rows }, null, 2));
    const failed = rows.filter((row) => !row.pass);
    expect(failed, failed.map((row) => `${row.id}: ${row.detail}`).join("\n")).toEqual([]);
  });
});

export type { Row };
