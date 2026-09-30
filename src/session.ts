import { gaps, percentile } from "./stats.js";
import type {
  SessionOptions,
  StreamKind,
  StreamSession,
  StreamVitals,
} from "./types.js";

export function createStreamSession(options: SessionOptions): StreamSession {
  const now = options.now ?? (() => Date.now());
  const stallMs = options.stallMs ?? 1500;
  const usableChars = options.usableChars ?? 40;

  let sendAt: number | null = null;
  let firstVisibleAt: number | null = null;
  let usableAt: number | null = null;
  let visibleChars = 0;
  const visibleTimes: number[] = [];
  let lastVisibleAt: number | null = null;
  let stallCount = 0;
  let longestStallMs = 0;
  let chunkCount = 0;

  function isVisible(kind: StreamKind, explicit?: boolean, text?: string) {
    if (explicit !== undefined) return explicit;
    if (kind !== "text") return false;
    return Boolean(text && text.length > 0);
  }

  function snapshot(): StreamVitals {
    const interval = gaps(visibleTimes).sort((a, b) => a - b);
    return {
      responseId: options.responseId,
      model: options.model,
      timeToFirstVisible:
        sendAt !== null && firstVisibleAt !== null
          ? firstVisibleAt - sendAt
          : null,
      renderLagMs: null,
      timeToUsable:
        sendAt !== null && usableAt !== null ? usableAt - sendAt : null,
      chunkCount,
      visibleChunkCount: visibleTimes.length,
      cadenceMs: {
        p50: percentile(interval, 50),
        p95: percentile(interval, 95),
      },
      stallCount,
      longestStallMs,
      toolActiveMs: 0,
    };
  }

  return {
    markSend() {
      sendAt = now();
    },
    markChunk(input = {}) {
      chunkCount += 1;
      const at = now();
      const kind = input.kind ?? "text";
      if (!isVisible(kind, input.visible, input.text)) return;

      if (lastVisibleAt !== null) {
        const gap = at - lastVisibleAt;
        if (gap >= stallMs) {
          stallCount += 1;
          if (gap > longestStallMs) longestStallMs = gap;
        }
      }

      visibleTimes.push(at);
      lastVisibleAt = at;
      if (firstVisibleAt === null) firstVisibleAt = at;
      if (input.text) visibleChars += input.text.length;
      if (usableAt === null && visibleChars >= usableChars) usableAt = at;
    },
    markPainted() {},
    markToolStart() {},
    markToolEnd() {},
    markEnd() {
      return snapshot();
    },
    snapshot,
  };
}