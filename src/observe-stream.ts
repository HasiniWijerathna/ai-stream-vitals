import type { StreamKind, StreamSession } from "./types.js";
/**
 * Read a plain-text stream and track its chunks.
 * Handles UTF-8 characters split across byte chunks.
 *
 * Consumes the stream without displaying text or tracking paint.
 * Does not parse SSE or JSON. Read errors are passed to the caller.
 * Call markSend() before starting and markEnd() after finishing.
 */
export async function observeTextStream(
  session: StreamSession,
  stream: ReadableStream<Uint8Array | string>,
  options: { kind?: StreamKind } = {},
): Promise<void> {
  const kind = options.kind ?? "text";
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  function record(text: string): void {
    if (text) session.markChunk({ kind, text });
  }

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      if (typeof value === "string") {
        // Flush pending bytes before processing already-decoded text.
        record(decoder.decode());
        record(value);
      } else {
        // Keep incomplete UTF-8 sequences for the next byte chunk.
        record(decoder.decode(value, { stream: true }));
      }
    }

    // Flush any bytes still buffered when the stream ends.
    record(decoder.decode());
  } finally {
    reader.releaseLock();
  }
}