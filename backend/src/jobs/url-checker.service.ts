import { Inject, Injectable } from '@nestjs/common';
import { PROCESSING_CONFIG, ProcessingConfig } from './config/processing.config';

export interface UrlCheckResult {
  readonly ok: boolean;
  readonly httpStatus: number | null;
  readonly error: string | null;
}

/**
 * Выполняет HTTP HEAD-запрос к одному URL и нормализует результат.
 * Использует глобальный fetch (Node.js 18+) с таймаутом.
 */
@Injectable()
export class UrlCheckerService {
  constructor(
    @Inject(PROCESSING_CONFIG) private readonly config: ProcessingConfig,
  ) {}

  async check(url: string, externalSignal?: AbortSignal): Promise<UrlCheckResult> {
    const timeout = AbortSignal.timeout(this.config.requestTimeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, timeout])
      : timeout;

    try {
      const response = await fetch(url, { method: 'HEAD', signal, redirect: 'follow' });
      return {
        ok: response.ok,
        httpStatus: response.status,
        error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    } catch (error) {
      return {
        ok: false,
        httpStatus: null,
        error: this.normalizeError(error),
      };
    }
  }

  private normalizeError(error: unknown): string {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return `Превышен таймаут запроса (${this.config.requestTimeoutMs} мс)`;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'Запрос отменён';
    }
    if (error instanceof Error) {
      // У fetch причина сетевой ошибки обычно лежит в cause.
      const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
      if (cause?.code) {
        return `${error.message} (${cause.code})`;
      }
      return error.message;
    }
    return 'Неизвестная ошибка при выполнении запроса';
  }
}
