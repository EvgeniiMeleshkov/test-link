import { useEffect } from 'react';
import { fetchJobs } from '../store/jobsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { isTerminal } from '../types';

/**
 * Периодически обновляет список заданий, ПОКА в нём есть незавершённые задания,
 * чтобы статистика в списке (успешно/с ошибкой) обновлялась в реальном времени.
 *
 * Как только все задания достигли конечного статуса — опрос прекращается
 * (интервал очищается). При создании нового задания список снова содержит
 * незавершённое задание, и опрос автоматически возобновляется.
 */
export function useJobsListPolling(intervalMs = 2000): void {
  const dispatch = useAppDispatch();
  const hasActiveJobs = useAppSelector((state) =>
    state.jobs.list.some((job) => !isTerminal(job.status)),
  );

  useEffect(() => {
    if (!hasActiveJobs) {
      return;
    }

    const timer = setInterval(() => {
      void dispatch(fetchJobs());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasActiveJobs, intervalMs, dispatch]);
}
