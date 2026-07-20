import { JobStatus, UrlStatus } from '../types';
import { JOB_STATUS_LABELS, URL_STATUS_LABELS } from '../utils/format';

interface Props {
  status: JobStatus | UrlStatus;
}

// Цветовой бейдж статуса. Классы задают цвет через CSS.
export function StatusBadge({ status }: Props) {
  const label =
    (JOB_STATUS_LABELS as Record<string, string>)[status] ??
    (URL_STATUS_LABELS as Record<string, string>)[status] ??
    status;

  return <span className={`badge badge--${status}`}>{label}</span>;
}
