/**
 * Настройки фоновой обработки заданий.
 * Значения берутся из переменных окружения (с безопасными значениями по умолчанию),
 * что позволяет переопределять их в тестах (например, обнулять задержку).
 */

export const PROCESSING_CONFIG = Symbol('PROCESSING_CONFIG');

export interface ProcessingConfig {
  /** Максимум одновременных HEAD-запросов в рамках одного задания. */
  readonly concurrency: number;
  /** Минимальная искусственная задержка перед сохранением результата, мс. */
  readonly delayMinMs: number;
  /** Максимальная искусственная задержка перед сохранением результата, мс. */
  readonly delayMaxMs: number;
  /** Таймаут одного HEAD-запроса, мс. */
  readonly requestTimeoutMs: number;
}

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function loadProcessingConfig(env: NodeJS.ProcessEnv = process.env): ProcessingConfig {
  return {
    concurrency: Math.max(1, readInt(env.JOB_CONCURRENCY, 5)),
    delayMinMs: readInt(env.JOB_DELAY_MIN_MS, 0),
    delayMaxMs: readInt(env.JOB_DELAY_MAX_MS, 10_000),
    requestTimeoutMs: Math.max(1, readInt(env.JOB_REQUEST_TIMEOUT_MS, 10_000)),
  };
}
