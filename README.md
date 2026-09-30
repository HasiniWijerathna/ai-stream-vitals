# ai-stream-vitals

Lightweight browser library for **streaming-AI UX metrics**.

Server dashboards measure time-to-first-token on the API. That number can look fast while the user still sees a blank bubble: the first chunk was reasoning, React has not painted yet, or a tool call left a gap.

This library records what happened **in the tab**: send → first visible text, paint lag, stalls, cadence, tool time.

- **npm:** [ai-stream-vitals](https://www.npmjs.com/package/ai-stream-vitals)
- **Live demo:** [https://hasiniwijerathna.github.io/ai-stream-vitals/](https://hasiniwijerathna.github.io/ai-stream-vitals/)

The demo watches the bubble with `createMonitor`. Click Send. Reasoning is skipped, then text streams, then a 2s stall. Metrics print under the bubble.

## What it measures

| Metric | Meaning |
| --- | --- |
| `timeToFirstVisible` | Send → first *visible* text chunk. `kind: "reasoning"` does not count. |
| `renderLagMs` | First visible chunk → `markPainted()` (use `afterPaint` or a DOM observer). |
| `timeToUsable` | Send → enough visible characters (default 40). |
| `stallCount` / `longestStallMs` | Gaps between visible chunks longer than `stallMs` (default 1500). |
| `cadenceMs.p50` / `p95` | Spacing between visible chunks. |
| `toolActiveMs` | Time between `markToolStart` and `markToolEnd`. |

## Install

```bash
npm install ai-stream-vitals
```

## Usage

Manual marks:

```ts
import { createStreamSession, afterPaint } from "ai-stream-vitals";

const session = createStreamSession({
  responseId: "r1",
  model: "gpt-4.1",
  stallMs: 1500,
  usableChars: 40,
});

session.markSend();
session.markChunk({ kind: "reasoning", text: "thinking..." });
session.markChunk({ kind: "text", text: "Hello" });
afterPaint(() => session.markPainted());
const metrics = session.markEnd();
```

## Optional automatic monitoring

`createMonitor` starts the session and can watch a bubble or a stream.
Do not attach both to the same reply.

```ts
import { createMonitor } from "ai-stream-vitals";

const monitor = createMonitor({
  responseId: "r1",
  model: "gpt-4.1",
  element: bubbleEl,
});

await monitor.observeTextStream(response.body);
const metrics = monitor.end();
```

If the UI also needs the bytes:

```ts
const [forUi, forMetrics] = response.body.tee();
await monitor.observeTextStream(forMetrics);
```

## Limitations

- Use either `element` or `observeTextStream` for one reply. Using both records the same text twice.
- `observeTextStream` consumes the stream and does not send it to the UI. Split first with `stream.tee()` if the UI also needs the bytes. The unread branch can buffer.
- `end()` disconnects the DOM observer and returns metrics. It does not cancel `fetch` or the reader, and later `markChunk` calls can still update the session.

## Local demo

```bash
git clone https://github.com/HasiniWijerathna/ai-stream-vitals.git
cd ai-stream-vitals
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

Licensed under MIT. See [LICENSE](./LICENSE).

Copyright (c) 2026 Hasini Wijerathna
