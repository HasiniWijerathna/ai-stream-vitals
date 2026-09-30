export function afterPaint(cb: () => void): void {
  if (typeof requestAnimationFrame !== "function") {
    cb();
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(cb));
}