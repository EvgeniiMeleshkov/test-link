/**
 * Запускает обработку элементов с ограничением на число одновременных задач.
 *
 * Держит не более `limit` активных воркеров; каждый воркер по завершении
 * забирает следующий элемент из очереди. Порядок старта — как в исходном массиве.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  let cursor = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));

  const runNext = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => runNext()));
}
