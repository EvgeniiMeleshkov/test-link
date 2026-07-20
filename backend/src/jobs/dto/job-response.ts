import { Job, JobStatus, UrlCheck, UrlStatus } from '../domain/job.types';

/** Агрегированная статистика по URL внутри задания. */
export interface JobStats {
  total: number;
  pending: number;
  inProgress: number;
  success: number;
  error: number;
  cancelled: number;
  /** Количество обработанных URL (success + error + cancelled). */
  processed: number;
}

/** Краткое представление задания для списка GET /api/jobs. */
export interface JobSummaryResponse {
  id: string;
  createdAt: string;
  status: JobStatus;
  stats: JobStats;
}

/** Представление одного URL для детального ответа. */
export interface UrlCheckResponse {
  id: string;
  url: string;
  status: UrlStatus;
  httpStatus: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

/** Детальное представление задания для GET /api/jobs/:id. */
export interface JobDetailsResponse extends JobSummaryResponse {
  urls: UrlCheckResponse[];
}

export function buildStats(urls: readonly UrlCheck[]): JobStats {
  const stats: JobStats = {
    total: urls.length,
    pending: 0,
    inProgress: 0,
    success: 0,
    error: 0,
    cancelled: 0,
    processed: 0,
  };

  for (const url of urls) {
    switch (url.status) {
      case UrlStatus.Pending:
        stats.pending += 1;
        break;
      case UrlStatus.InProgress:
        stats.inProgress += 1;
        break;
      case UrlStatus.Success:
        stats.success += 1;
        break;
      case UrlStatus.Error:
        stats.error += 1;
        break;
      case UrlStatus.Cancelled:
        stats.cancelled += 1;
        break;
    }
  }

  stats.processed = stats.success + stats.error + stats.cancelled;
  return stats;
}

export function toSummary(job: Job): JobSummaryResponse {
  return {
    id: job.id,
    createdAt: job.createdAt.toISOString(),
    status: job.status,
    stats: buildStats(job.urls),
  };
}

function toUrlResponse(url: UrlCheck): UrlCheckResponse {
  return {
    id: url.id,
    url: url.url,
    status: url.status,
    httpStatus: url.httpStatus,
    error: url.error,
    startedAt: url.startedAt ? url.startedAt.toISOString() : null,
    finishedAt: url.finishedAt ? url.finishedAt.toISOString() : null,
    durationMs: url.durationMs,
  };
}

export function toDetails(job: Job): JobDetailsResponse {
  return {
    ...toSummary(job),
    urls: job.urls.map(toUrlResponse),
  };
}
