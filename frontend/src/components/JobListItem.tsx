import { JobSummary } from '../types';
import { formatDateTime } from '../utils/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  job: JobSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function JobListItem({ job, isActive, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        className={`job-item ${isActive ? 'job-item--active' : ''}`}
        onClick={() => onSelect(job.id)}
        aria-current={isActive}
      >
        <div className="job-item__row">
          <span className="job-item__id" title={job.id}>
            {job.id.slice(0, 8)}
          </span>
          <StatusBadge status={job.status} />
        </div>
        <div className="job-item__meta">{formatDateTime(job.createdAt)}</div>
        <div className="job-item__stats">
          <span>Всего: {job.stats.total}</span>
          <span className="text-success">✓ {job.stats.success}</span>
          <span className="text-error">✕ {job.stats.error}</span>
        </div>
      </button>
    </li>
  );
}
