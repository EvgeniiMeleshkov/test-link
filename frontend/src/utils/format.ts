import { JobStatus, UrlStatus } from '../types';

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'В очереди',
  in_progress: 'Обработка',
  completed: 'Завершено',
  cancelled: 'Отменено',
  failed: 'Ошибка',
};

export const URL_STATUS_LABELS: Record<UrlStatus, string> = {
  pending: 'В очереди',
  in_progress: 'Проверка',
  success: 'Успех',
  error: 'Ошибка',
  cancelled: 'Отменён',
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return '—';
  }
  if (ms < 1000) {
    return `${ms} мс`;
  }
  return `${(ms / 1000).toFixed(2)} с`;
}
