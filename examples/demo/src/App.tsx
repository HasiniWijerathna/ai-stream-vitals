import { useState } from "react";
import { afterPaint, createStreamSession } from "ai-stream-vitals";
import type { StreamVitals } from "ai-stream-vitals";

const events = [
  { delay: 400, kind: "reasoning" as const, text: "thinking..." },
  { delay: 800, kind: "text" as const, text: "Hello " },
  { delay: 80, kind: "text" as const, text: "world. " },
  { delay: 80, kind: "text" as const, text: "This is " },
  { delay: 2000, kind: "text" as const, text: "a stall, " },
  { delay: 80, kind: "text" as const, text: "then more text." },
];

export default function App() {
  const [text, setText] = useState("");
  const [metrics, setMetrics] = useState<StreamVitals | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setText("");
    setMetrics(null);

    const session = createStreamSession({
      responseId: "demo",
      model: "fake",
      stallMs: 1500,
      usableChars: 20,
    });

    session.markSend();

    for (const event of events) {
      await wait(event.delay);
      session.markChunk({ kind: event.kind, text: event.text });
      if (event.kind === "text") {
        setText((prev) => prev + event.text);
        afterPaint(() => session.markPainted());
      }
    }

    setMetrics(session.markEnd());
    setBusy(false);
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "40px auto" }}>
      <h1>ai-stream-vitals demo</h1>
      <p>Reasoning first, then text, then a 2s stall.</p>
      <button disabled={busy} onClick={run}>
        {busy ? "Streaming…" : "Send"}
      </button>
      <pre style={{ background: "#111", color: "#eee", padding: 16, minHeight: 80 }}>
        {text || "(no visible text yet)"}
      </pre>
      {metrics && (
        <pre style={{ background: "#f4f4f4", padding: 16 }}>
          {JSON.stringify(metrics, null, 2)}
        </pre>
      )}
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}