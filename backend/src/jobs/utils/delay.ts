/** Промис-обёртка над setTimeout. */
export function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Случайное целое число миллисекунд в диапазоне [min, max]. */
export function randomDelayMs(min: number, max: number): number {
  const low = Math.max(0, Math.min(min, max));
  const high = Math.max(min, max);
  return low + Math.floor(Math.random() * (high - low + 1));
}
