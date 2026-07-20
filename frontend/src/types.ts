// Типы ответов API — зеркалят контракт бэкенда.

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

export type UrlStatus = 'pending' | 'in_progress' | 'success' | 'error' | 'cancelled';

export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = ['completed', 'cancelled', 'failed'];

export function isTerminal(status: JobStatus | undefined): boolean {
  return status !== undefined && TERMINAL_JOB_STATUSES.includes(status);
}

export interface JobStats {
  total: number;
  pending: number;
  inProgress: number;
  success: number;
  error: number;
  cancelled: number;
  processed: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  stats: JobStats;
}

export interface UrlCheck {
  id: string;
  url: string;
  status: UrlStatus;
  httpStatus: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface JobDetails extends JobSummary {
  urls: UrlCheck[];
}
