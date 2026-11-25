import { rollbackTrailingUser, runPolicyTurn, type DemoState } from "@/lib/demo";
import { liveConfigured, runLiveTurn } from "@/lib/live";

export async function respondWithEngine(state: DemoState, sessionId: string, text: string) {
  if (liveConfigured()) {
    try {
      return { session: await runLiveTurn(state, sessionId, text), engine: "live" as const };
    } catch (error) {
      console.error("Live model failed, using the demo policy.", error);
      rollbackTrailingUser(state, sessionId, text);
    }
  }
  return { session: runPolicyTurn(state, sessionId, text), engine: "demo" as const };
}

export async function respond(state: DemoState, sessionId: string, text: string) {
  return (await respondWithEngine(state, sessionId, text)).session;
}
