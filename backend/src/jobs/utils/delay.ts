/** Промис-обёртка над setTimeout. Поддерживает отмену через AbortSignal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = (): void => {
      clearTimeout(timer);
      cleanup();
      resolve();
    };

    const cleanup = (): void => {
      signal?.removeEventListener('abort', onAbort);
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/** Случайное целое число миллисекунд в диапазоне [min, max]. */
export function randomDelayMs(min: number, max: number): number {
  const low = Math.max(0, Math.min(min, max));
  const high = Math.max(min, max);
  return low + Math.floor(Math.random() * (high - low + 1));
}
