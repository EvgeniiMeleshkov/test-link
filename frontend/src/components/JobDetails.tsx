import { cancelJob } from '../store/jobsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { isTerminal } from '../types';
import { formatDateTime } from '../utils/format';
import { ProgressBar } from './ProgressBar';
import { StatusBadge } from './StatusBadge';
import { UrlRow } from './UrlRow';

export function JobDetails() {
  const dispatch = useAppDispatch();
  const activeJobId = useAppSelector((state) => state.jobs.activeJobId);
  const job = useAppSelector((state) => state.jobs.activeJob);
  const activeError = useAppSelector((state) => state.jobs.activeError);
  const cancelling = useAppSelector((state) => state.jobs.cancelling);

  if (!activeJobId) {
    return (
      <section className="card job-details job-details--empty">
        <p className="muted">Выберите задание из списка или создайте новое.</p>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="card job-details">
        {activeError ? <p className="error-text">{activeError}</p> : <p className="muted">Загрузка деталей…</p>}
      </section>
    );
  }

  const canCancel = !isTerminal(job.status);

  return (
    <section className="card job-details">
      <div className="job-details__header">
        <div>
          <h2>Задание</h2>
          <div className="job-details__id" title={job.id}>
            {job.id}
          </div>
          <div className="muted">{formatDateTime(job.createdAt)}</div>
        </div>
        <div className="job-details__actions">
          <StatusBadge status={job.status} />
          <button
            type="button"
            className="button button--danger"
            onClick={() => dispatch(cancelJob(job.id))}
            disabled={!canCancel || cancelling}
          >
            {cancelling ? 'Отмена…' : 'Отменить задание'}
          </button>
        </div>
      </div>

      <ProgressBar processed={job.stats.processed} total={job.stats.total} />

      <div className="job-details__stats">
        <span className="text-success">Успешно: {job.stats.success}</span>
        <span className="text-error">С ошибкой: {job.stats.error}</span>
        <span className="muted">Отменено: {job.stats.cancelled}</span>
        <span className="muted">В очереди: {job.stats.pending}</span>
        <span className="muted">В работе: {job.stats.inProgress}</span>
      </div>

      {activeError && <p className="error-text">{activeError}</p>}

      <div className="table-wrapper">
        <table className="url-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Статус</th>
              <th className="center">HTTP</th>
              <th className="center">Время</th>
              <th>Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {job.urls.map((url) => (
              <UrlRow key={url.id} url={url} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
