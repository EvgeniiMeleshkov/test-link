/**
 * Доменные типы и статусы для заданий проверки URL.
 * Хранятся только в памяти процесса (in-memory), БД не используется.
 */

export enum JobStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

export enum UrlStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Success = 'success',
  Error = 'error',
  Cancelled = 'cancelled',
}

/** Конечные статусы задания — при них фоновая обработка уже завершена. */
export const TERMINAL_JOB_STATUSES: ReadonlySet<JobStatus> = new Set([
  JobStatus.Completed,
  JobStatus.Cancelled,
  JobStatus.Failed,
]);

/** Результат проверки одного URL. */
export interface UrlCheck {
  readonly id: string;
  readonly url: string;
  status: UrlStatus;
  httpStatus: number | null;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  /** Длительность обработки в миллисекундах (включая искусственную задержку). */
  durationMs: number | null;
}

/** Задание — набор URL, обрабатываемых асинхронно. */
export interface Job {
  readonly id: string;
  readonly createdAt: Date;
  status: JobStatus;
  readonly urls: UrlCheck[];
}
