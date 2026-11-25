import { rollbackTrailingUser, runPolicyTurn, type DemoState } from "@/lib/demo";
import { liveConfigured, runLiveTurn } from "@/lib/live";

export async function respond(state: DemoState, sessionId: string, text: string) {
  if (liveConfigured()) {
    try {
      return await runLiveTurn(state, sessionId, text);
    } catch (error) {
      console.error("Live model failed, using the demo policy.", error);
      rollbackTrailingUser(state, sessionId, text);
    }
  }
  return runPolicyTurn(state, sessionId, text);
}
