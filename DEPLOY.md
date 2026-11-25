# Deploy

Portfolio demo by Quvantic - fictional brand, not a real business / not client work.

The intended public host is `https://fintech-chat.quvantic.com`.

This app is a single Next.js server. The customer chat and the agent desk share one in-memory store, with a JSON file at `data/runtime.json` so a restart of that same process can keep the demo. A serverless fan-out (many isolated instances) will not share a handoff between the chat and the desk. Run one Node process, or a single container.

## Vercel

1. Create a project from this repo.
2. Set the production region to one region so the demo process stays coherent if you are on a plan that still splits invocations. For a reliable desk, prefer `next start` on a long-running host.
3. Add the domain `fintech-chat.quvantic.com`.
4. Leave `LLM_PROVIDER=mock` unless you want the live model.
5. To use the live model, set `LLM_PROVIDER=live`, `AI_GATEWAY_API_KEY`, and optionally `LUMEN_MODEL` (default `openai/gpt-5.6-sol`).

The mock policy is what CI runs. It does not call a model.

## Docker

```bash
docker build -t lumen-support .
docker run --rm -p 38471:38471 lumen-support
```

Open `http://localhost:38471`.
