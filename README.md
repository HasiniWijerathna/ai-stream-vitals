# ai-stream-vitals

Lightweight browser metrics for streaming AI responses.

Server metrics can show that an AI response started quickly while the user still sees an empty chat bubble. The delay may come from reasoning, tool calls, network gaps, or frontend rendering.

`ai-stream-vitals` helps measure what happens in the browser: when a response starts, when text appears in the response element, paint delay, usable text timing, stalls, cadence, and tool activity.

**Live demo:** https://hasiniwijerathna.github.io/ai-stream-vitals/

The demo uses `createMonitor()` to watch an answer bubble automatically. It skips reasoning text, shows visible text in stages, and includes a two-second stall.

## Install

```bash
npm install ai-stream-vitals
```

## Automatic DOM monitoring

Use `createMonitor()` when your application already renders the response into a DOM element.

```tsx
import { useRef } from "react";
import { createMonitor } from "ai-stream-vitals";

const answerRef = useRef<HTMLPreElement>(null);

async function handleResponse() {
  const element = answerRef.current;

  if (!element) return;

  const monitor = createMonitor({
    responseId: "reply-1",
    model: "gpt-4.1",
    element,
    stallMs: 1500,
    usableChars: 40,
  });

  // Update the element normally as the AI response arrives.
  // The monitor observes appended text automatically.

  const metrics = monitor.end();
  console.log(metrics);
}

return <pre ref={answerRef}>{answerText}</pre>;
```

The observed element should start empty, or contain only text that should be treated as the initial baseline.

## Metrics

| Metric | Meaning |
| --- | --- |
| `timeToFirstVisible` | Time from `markSend()` to the first text chunk recorded by the session. |
| `renderLagMs` | Time from the first recorded text chunk to the estimated paint callback. |
| `timeToUsable` | Time until the configured number of text characters has been recorded. |
| `stallCount` | Number of gaps between text chunks at least as long as `stallMs`. |
| `longestStallMs` | The longest gap between text chunks. |
| `cadenceMs.p50` / `p95` | Percentiles for the gaps between text chunks. |
| `chunkCount` | Number of chunks recorded by the session. |
| `visibleChunkCount` | Number of chunks classified as visible text. |
| `toolActiveMs` | Total time recorded between tool start and tool end events. |

DOM observation detects text changes in the DOM. It does not verify that the text is visible on screen.

## Plain-text stream monitoring

You can track a plain-text or byte stream directly:

```ts
import { createStreamSession, observeTextStream } from "ai-stream-vitals";

const session = createStreamSession({
  responseId: "reply-1",
  model: "gpt-4.1",
});

session.markSend();

await observeTextStream(session, stream);

const metrics = session.markEnd();
console.log(metrics);
```

Byte chunks are decoded as UTF-8, including characters split across chunks. This helper does not parse SSE or JSON events.

## Manual session tracking

For applications that already handle stream events, you can record them manually:

```ts
import { afterPaint, createStreamSession } from "ai-stream-vitals";

const session = createStreamSession({
  responseId: "reply-1",
  model: "gpt-4.1",
  stallMs: 1500,
  usableChars: 40,
});

session.markSend();
session.markChunk({ kind: "reasoning", text: "thinking..." });
session.markChunk({ kind: "text", text: "Hello" });

afterPaint(() => session.markPainted());

session.markToolStart();
// Run a tool here.
session.markToolEnd();

const metrics = session.markEnd();
console.log(metrics);
```

You can send the returned object to your own analytics endpoint. The package does not host analytics.

## Limitations

- Use either `element` or `observeTextStream` for one reply. Using both records the same text twice.
- `observeTextStream` consumes the stream and does not send it to the UI. Split first with `stream.tee()` if the UI also needs the bytes. A slower or unread branch can accumulate buffered data.
- `end()` disconnects the DOM observer and returns metrics. It does not cancel `fetch` or the reader, and later `markChunk` calls can still update the session.
- `observeElement` tracks appended text. Replacing the existing text is ignored so that replacements are not counted as appended response text.
- `observeTextStream` tracks plain text or decoded bytes. It does not parse provider-specific SSE, JSON, reasoning, or tool events automatically.
- Paint timing is an estimate based on browser animation frames. It is not a guarantee that the text was visible to the user.

## Local development

```bash
npm install
npm run build
```

Run the demo:

```bash
cd examples/demo
npm install
npm run dev
```

## Tests

```bash
npm test
npm run typecheck
```

Increase the package version before publishing a new release:

```bash
npm version patch
```

## License

MIT
