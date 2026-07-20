import { useEffect } from 'react';
import { fetchJobDetails, fetchJobs } from '../store/jobsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { isTerminal } from '../types';

/**
 * Опрашивает GET /api/jobs/:id, пока задание не достигнет конечного статуса.
 *
 * Гарантии:
 *  - при смене активного задания старый интервал очищается (cleanup эффекта);
 *  - при достижении конечного статуса опрос прекращается;
 *  - устаревшие ответы отбрасываются в редьюсере (сверка по activeJobId),
 *    поэтому «догоняющие» ответы прошлого задания не влияют на UI.
 */
export function useActiveJobPolling(intervalMs = 1500): void {
  const dispatch = useAppDispatch();
  const activeJobId = useAppSelector((state) => state.jobs.activeJobId);
  const activeStatus = useAppSelector((state) => state.jobs.activeJob?.status);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    // Немедленный запрос при (пере)активации.
    void dispatch(fetchJobDetails(activeJobId));

    if (isTerminal(activeStatus)) {
      // Задание завершено — обновляем список (актуализируем статистику) и не опрашиваем.
      void dispatch(fetchJobs());
      return;
    }

    const timer = setInterval(() => {
      void dispatch(fetchJobDetails(activeJobId));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeJobId, activeStatus, intervalMs, dispatch]);
}
