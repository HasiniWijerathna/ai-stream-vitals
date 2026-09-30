# ai-stream-vitals

Browser metrics for streaming AI replies: first visible token, chunk cadence, stalls, and paint lag.

## Use

```ts
import { createStreamSession, afterPaint } from "ai-stream-vitals";

const session = createStreamSession({
  responseId: "r1",
  model: "gpt-4.1",
});

session.markSend();
session.markChunk({ kind: "text", text: "Hello" });
afterPaint(() => session.markPainted());
console.log(session.markEnd());

## Demo

A React example lives in examples/demo.

From the repo root:

npm install
npm run build
cd examples/demo
npm install
npm run dev