import { setActiveJob } from '../store/jobsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { JobListItem } from './JobListItem';

export function JobList() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, activeJobId } = useAppSelector((state) => state.jobs);

  return (
    <section className="card job-list">
      <h2>Задания</h2>

      {listStatus === 'loading' && list.length === 0 && <p className="muted">Загрузка…</p>}
      {listError && <p className="error-text">{listError}</p>}
      {listStatus === 'succeeded' && list.length === 0 && (
        <p className="muted">Пока нет заданий. Создайте первое.</p>
      )}

      <ul className="job-list__items">
        {list.map((job) => (
          <JobListItem
            key={job.id}
            job={job}
            isActive={job.id === activeJobId}
            onSelect={(id) => dispatch(setActiveJob(id))}
          />
        ))}
      </ul>
    </section>
  );
}
