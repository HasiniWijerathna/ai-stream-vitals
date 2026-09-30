export type StreamKind = "text" | "reasoning" | "tool" | "other";

export interface StreamVitals {
  responseId: string;
  model?: string;
  timeToFirstVisible: number | null;
  renderLagMs: number | null;
  timeToUsable: number | null;
  chunkCount: number;
  visibleChunkCount: number;
  cadenceMs: { p50: number | null; p95: number | null };
  stallCount: number;
  longestStallMs: number;
  toolActiveMs: number;
}

export interface SessionOptions {
  responseId: string;
  model?: string;
  stallMs?: number;
  usableChars?: number;
  now?: () => number;
}

export interface StreamSession {
  markSend: () => void;
  markChunk: (input?: {
    kind?: StreamKind;
    text?: string;
    visible?: boolean;
  }) => void;
  markPainted: () => void;
  markToolStart: () => void;
  markToolEnd: () => void;
  markEnd: () => StreamVitals;
  snapshot: () => StreamVitals;
}