import { describe, expect, it } from "vitest";
import { createStreamSession } from "../src/session";

function clock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("createStreamSession", () => {
  it("ignores reasoning for first visible token", () => {
    const c = clock();
    const s = createStreamSession({ responseId: "r1", now: c.now });
    s.markSend();
    c.advance(400);
    s.markChunk({ kind: "reasoning", text: "thinking" });
    c.advance(2000);
    s.markChunk({ kind: "text", text: "Hello world from the model." });
    c.advance(16);
    s.markPainted();
    const v = s.markEnd();
    expect(v.timeToFirstVisible).toBe(2400);
    expect(v.renderLagMs).toBe(16);
  });

  it("counts stalls", () => {
    const c = clock();
    const s = createStreamSession({
      responseId: "r2",
      stallMs: 1500,
      usableChars: 8,
      now: c.now,
    });
    s.markSend();
    c.advance(100);
    s.markChunk({ text: "Hello wo" });
    c.advance(2000);
    s.markChunk({ text: "rld" });
    const v = s.markEnd();
    expect(v.stallCount).toBe(1);
    expect(v.longestStallMs).toBe(2000);
    expect(v.timeToUsable).toBe(100);
  });
});