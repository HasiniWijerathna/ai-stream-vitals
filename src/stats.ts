export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? null;
}

export function gaps(times: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    out.push(times[i]! - times[i - 1]!);
  }
  return out;
}