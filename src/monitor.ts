import { observeElement } from "./observe-dom.js";
import { observeTextStream } from "./observe-stream.js";
import { createStreamSession } from "./session.js";
import type { SessionOptions, StreamKind, StreamSession, StreamVitals } from "./types.js";

export type MonitorOptions = SessionOptions & {
  element?: Element;
};

export type StreamMonitor = {
  session: StreamSession;
  observeTextStream: (
    stream: ReadableStream<Uint8Array | string>,
    options?: { kind?: StreamKind },
  ) => Promise<void>;
  end: () => StreamVitals;
};

// Start tracking a response.
// Use DOM or stream tracking; using both counts text twice
export function createMonitor(options: MonitorOptions): StreamMonitor {
  const session = createStreamSession(options);
  session.markSend();

  // Watch the element if one is provided.
  const stopDom = options.element
    ? observeElement(session, options.element)
    : undefined;

  return {
    session,

    // Read and trak the stream without displaying it.
    observeTextStream(stream, streamOptions) {
      return observeTextStream(session, stream, streamOptions);
    },

    // Stop watching the DOM and return metrics.
    // This does not stop an active stream
    end() {
      stopDom?.();
      return session.markEnd();
    },
  };
}