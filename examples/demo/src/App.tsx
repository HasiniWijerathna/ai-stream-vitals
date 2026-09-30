import { useRef, useState } from "react";
import { createMonitor } from "ai-stream-vitals";
import type { StreamVitals } from "ai-stream-vitals";

// Fake stream: reasoning first, then text, then a long pause.
const events = [
  { delay: 400, kind: "reasoning" as const, text: "thinking..." },
  { delay: 800, kind: "text" as const, text: "Hello " },
  { delay: 80, kind: "text" as const, text: "world. " },
  { delay: 80, kind: "text" as const, text: "This is " },
  { delay: 2000, kind: "text" as const, text: "a stall, " },
  { delay: 80, kind: "text" as const, text: "then more text." },
];

export default function App() {
  const bubbleRef = useRef<HTMLPreElement>(null);
  const [text, setText] = useState("");
  const [metrics, setMetrics] = useState<StreamVitals | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setText("");
    setMetrics(null);

    // Wait one frame so the empty bubble is in the DOM.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const el = bubbleRef.current;
    if (!el) {
      setBusy(false);
      return;
    }

    // Starts markSend and watches this bubble.
    const monitor = createMonitor({
      responseId: "demo",
      model: "fake",
      stallMs: 1500,
      usableChars: 20,
      element: el,
    });

    for (const event of events) {
      await wait(event.delay);
      // Only put visible text in the bubble. The observer records it.
      if (event.kind === "text") {
        setText((prev) => prev + event.text);
      }
    }

    // Give React a moment to flush the last text into the DOM.
    await wait(80);
    setMetrics(monitor.end());
    setBusy(false);
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "40px auto" }}>
      <h1>ai-stream-vitals demo</h1>
      <p>
        Click Send. Visible text is tracked automatically from the bubble with{" "}
        <code>createMonitor</code>. Reasoning is not written into the bubble.
        There is a 2s stall in the middle.
      </p>
      <button disabled={busy} onClick={run}>
        {busy ? "Streaming…" : "Send"}
      </button>
      <p>
        {busy
          ? "Watching the bubble. No markChunk calls — new text is recorded from the DOM."
          : "Metrics come from the observer, not from hand-marked tokens."}
      </p>
      <pre
        ref={bubbleRef}
        style={{ background: "#111", color: "#eee", padding: 16, minHeight: 80 }}
      >
        {text || "(no visible text yet)"}
      </pre>
      {metrics && (
        <>
          <p>Recorded automatically from appended DOM text.</p>
          <pre style={{ background: "#f4f4f4", padding: 16 }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </>
      )}
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}