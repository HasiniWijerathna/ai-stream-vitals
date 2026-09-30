import { createStreamSession } from "../dist/index.js";

const session = createStreamSession({
  responseId: "demo-1",
  model: "fake-model",
  usableChars: 8,
});

session.markSend();
session.markChunk({ kind: "reasoning", text: "thinking" });
session.markChunk({ kind: "text", text: "Hello wo" });
session.markPainted();
session.markChunk({ kind: "text", text: "rld" });

console.log(session.markEnd());