import { delay, randomDelayMs } from './delay';

describe('delay', () => {
  it('немедленно резолвится при ms <= 0', async () => {
    const start = Date.now();
    await delay(0);
    expect(Date.now() - start).toBeLessThan(20);
  });

  it('ждёт примерно заданное время', async () => {
    const start = Date.now();
    await delay(30);
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });
});

describe('randomDelayMs', () => {
  it('возвращает значение в диапазоне [min, max]', () => {
    for (let i = 0; i < 100; i += 1) {
      const value = randomDelayMs(100, 200);
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(200);
    }
  });

  it('корректно работает при min === max', () => {
    expect(randomDelayMs(50, 50)).toBe(50);
  });
});
