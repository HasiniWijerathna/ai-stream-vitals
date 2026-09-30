# ai-stream-vitals

Lightweight browser library for **streaming-AI UX metrics**.

Server dashboards measure time-to-first-token on the API. That number can look fast while the user still sees a blank bubble: the first chunk was reasoning, React has not painted yet, or a tool call left a gap.

This library records what happened **in the tab**: send → first visible text, paint lag, stalls, cadence, tool time.

**Live demo:** [https://hasiniwijerathna.github.io/ai-stream-vitals/](https://hasiniwijerathna.github.io/ai-stream-vitals/)

Click Send. You get reasoning first (not shown as visible text), then a stream, then a 2s stall. Metrics print under the bubble.

## What it measures

| Metric | Meaning |
| --- | --- |
| `timeToFirstVisible` | Send → first *visible* text chunk. `kind: "reasoning"` does not count. |
| `renderLagMs` | First visible chunk → `markPainted()` (use `afterPaint`). |
| `timeToUsable` | Send → enough visible characters (default 40). |
| `stallCount` / `longestStallMs` | Gaps between visible chunks longer than `stallMs` (default 1500). |
| `cadenceMs.p50` / `p95` | Spacing between visible chunks. |
| `toolActiveMs` | Time between `markToolStart` and `markToolEnd`. |

## Install

Not on npm yet. Use the repo:

```bash
npm install github:HasiniWijerathna/ai-stream-vitals
```

Or clone and build locally:

```bash
git clone https://github.com/HasiniWijerathna/ai-stream-vitals.git
cd ai-stream-vitals
npm install
npm run build
```

## Usage

```ts
import { createStreamSession, afterPaint } from "ai-stream-vitals";

const session = createStreamSession({
  responseId: "r1",
  model: "gpt-4.1",
  stallMs: 1500,
  usableChars: 40,
});

session.markSend();

// each token / SSE delta
session.markChunk({ kind: "reasoning", text: "thinking..." });
session.markChunk({ kind: "text", text: "Hello" });
afterPaint(() => session.markPainted());

session.markToolStart();
// tool runs...
session.markToolEnd();

const metrics = session.markEnd();
console.log(metrics);
```

`markEnd()` returns one object you can log or send with `navigator.sendBeacon` to your own endpoint. This package does not host analytics.

## Local demo

```bash
npm install
npm run build
cd examples/demo
npm install
npm run dev
```

## Tests

```bash
npm test
```

## License

MIT
