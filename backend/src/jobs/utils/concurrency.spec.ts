import { runWithConcurrency } from './concurrency';

describe('runWithConcurrency', () => {
  it('обрабатывает все элементы', async () => {
    const processed: number[] = [];
    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      processed.push(item);
    });
    expect(processed.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('не превышает лимит одновременных задач', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);

    await runWithConcurrency(items, 5, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    expect(maxActive).toBeLessThanOrEqual(5);
    expect(maxActive).toBeGreaterThan(1);
  });

  it('корректно работает с пустым массивом', async () => {
    const worker = jest.fn();
    await runWithConcurrency([], 5, worker);
    expect(worker).not.toHaveBeenCalled();
  });

  it('передаёт индекс элемента', async () => {
    const seen: Array<[string, number]> = [];
    await runWithConcurrency(['a', 'b', 'c'], 1, async (item, index) => {
      seen.push([item, index]);
    });
    expect(seen).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });
});
