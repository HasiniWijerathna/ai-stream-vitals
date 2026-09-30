import { afterPaint } from "./paint.js";
import type { StreamKind, StreamSession } from "./types.js";

export async function observeTextStream(
  session: StreamSession,
  stream: ReadableStream<Uint8Array | string>,
  options: { kind?: StreamKind } = {},
): Promise<void> {
  const kind = options.kind ?? "text";
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text =
        typeof value === "string" ? value : decoder.decode(value, { stream: true });
      if (!text) continue;
      session.markChunk({ kind, text });
      afterPaint(() => session.markPainted());
    }
  } finally {
    reader.releaseLock();
  }
}