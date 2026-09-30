import type {
  SessionOptions,
  StreamKind,
  StreamSession,
  StreamVitals,
} from "./types.js";

export function createStreamSession(options: SessionOptions): StreamSession {
  const now = options.now ?? (() => Date.now());

  let sendAt: number | null = null;
  let firstVisibleAt: number | null = null;
  let chunkCount = 0;
  let visibleChunkCount = 0;

  function isVisible(kind: StreamKind, explicit?: boolean, text?: string) {
    if (explicit !== undefined) return explicit;
    if (kind !== "text") return false;
    return Boolean(text && text.length > 0);
  }

  function snapshot(): StreamVitals {
    return {
      responseId: options.responseId,
      model: options.model,
      timeToFirstVisible:
        sendAt !== null && firstVisibleAt !== null
          ? firstVisibleAt - sendAt
          : null,
      renderLagMs: null,
      timeToUsable: null,
      chunkCount,
      visibleChunkCount,
      cadenceMs: { p50: null, p95: null },
      stallCount: 0,
      longestStallMs: 0,
      toolActiveMs: 0,
    };
  }

  return {
    markSend() {
      sendAt = now();
    },
    markChunk(input = {}) {
      chunkCount += 1;
      const kind = input.kind ?? "text";
      if (!isVisible(kind, input.visible, input.text)) return;
      visibleChunkCount += 1;
      if (firstVisibleAt === null) firstVisibleAt = now();
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