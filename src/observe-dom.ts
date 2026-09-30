import { afterPaint } from "./paint.js";
import type { StreamSession } from "./types.js";
/**
 * Observe appended text inside a chat-bubble element.
 * Records added DOM text as visible chunks without verifying screen visibility.
 * Schedules a paint-timing estimate after each addition.
 *
 * Existing text treated as the baseline and is not counted.
 * Returns a cleanup function to call when observation is no longer needed.
 */
export function observeElement(
  session: StreamSession,
  el: Element,
): () => void {
  let last = el.textContent ?? "";
  let stopped = false;
  const observer = new MutationObserver(() => {
    if (stopped) return;
    const next = el.textContent ?? "";
    // Ignore unchanged text, deletions, and replacements.
    // Update the baseline so nex t appends use the current content.
    if (next === last || !next.startsWith(last)) {
      last = next;
      return;
    }
    const text = next.slice(last.length);
    last = next;
    // The text exists in the DOM; it may not have been painted or be visible.
    session.markChunk({ kind: "text", text, visible: true });
    afterPaint(() => {
      // A scheduled callback may run after cleanup.
      if (!stopped) session.markPainted();
    });
  });
  observer.observe(el, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  return () => {
    stopped = true;
    observer.disconnect();
  };
}