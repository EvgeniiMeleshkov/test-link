import { describe, expect, it } from 'vitest';
import reducer, {
  cancelJob,
  createJob,
  fetchJobDetails,
  fetchJobs,
  setActiveJob,
  JobsState,
} from './jobsSlice';
import { JobDetails, JobSummary } from '../types';

function baseState(overrides: Partial<JobsState> = {}): JobsState {
  return {
    list: [],
    listStatus: 'idle',
    listError: null,
    activeJobId: null,
    activeJob: null,
    activeError: null,
    createStatus: 'idle',
    createError: null,
    cancellingId: null,
    ...overrides,
  };
}

const details = (id: string, status: JobDetails['status'] = 'in_progress'): JobDetails => ({
  id,
  createdAt: '2026-07-20T10:00:00.000Z',
  status,
  stats: { total: 1, pending: 0, inProgress: 1, success: 0, error: 0, cancelled: 0, processed: 0 },
  urls: [],
});

describe('jobsSlice', () => {
  it('setActiveJob сбрасывает детали предыдущего задания', () => {
    const state = baseState({ activeJobId: 'old', activeJob: details('old') });
    const next = reducer(state, setActiveJob('new'));
    expect(next.activeJobId).toBe('new');
    expect(next.activeJob).toBeNull();
  });

  it('setActiveJob на тот же id не сбрасывает данные', () => {
    const state = baseState({ activeJobId: 'a', activeJob: details('a') });
    const next = reducer(state, setActiveJob('a'));
    expect(next.activeJob).not.toBeNull();
  });

  it('игнорирует детали устаревшего (неактивного) jobId', () => {
    const state = baseState({ activeJobId: 'current', activeJob: null });
    const staleAction = {
      type: fetchJobDetails.fulfilled.type,
      payload: details('OLD-JOB'),
      meta: { arg: 'OLD-JOB', requestId: 'x', requestStatus: 'fulfilled' },
    };
    const next = reducer(state, staleAction as never);
    // Ответ по чужому id не должен менять activeJob.
    expect(next.activeJob).toBeNull();
  });

  it('применяет детали активного jobId', () => {
    const state = baseState({ activeJobId: 'current' });
    const action = {
      type: fetchJobDetails.fulfilled.type,
      payload: details('current'),
      meta: { arg: 'current', requestId: 'x', requestStatus: 'fulfilled' },
    };
    const next = reducer(state, action as never);
    expect(next.activeJob?.id).toBe('current');
  });

  it('createJob.fulfilled делает новое задание активным', () => {
    const state = baseState({ activeJobId: 'prev', activeJob: details('prev') });
    const action = {
      type: createJob.fulfilled.type,
      payload: { jobId: 'fresh' },
      meta: { requestId: 'x', requestStatus: 'fulfilled' },
    };
    const next = reducer(state, action as never);
    expect(next.activeJobId).toBe('fresh');
    expect(next.activeJob).toBeNull();
  });

  it('fetchJobs.fulfilled сохраняет список', () => {
    const list: JobSummary[] = [
      {
        id: 'j1',
        createdAt: '2026-07-20T10:00:00.000Z',
        status: 'completed',
        stats: { total: 2, pending: 0, inProgress: 0, success: 2, error: 0, cancelled: 0, processed: 2 },
      },
    ];
    const action = { type: fetchJobs.fulfilled.type, payload: list };
    const next = reducer(baseState(), action as never);
    expect(next.list).toHaveLength(1);
    expect(next.listStatus).toBe('succeeded');
  });

  it('cancelJob.fulfilled обновляет активное задание', () => {
    const state = baseState({ activeJobId: 'c1', activeJob: details('c1') });
    const action = {
      type: cancelJob.fulfilled.type,
      payload: details('c1', 'cancelled'),
      meta: { arg: 'c1', requestId: 'x', requestStatus: 'fulfilled' },
    };
    const next = reducer(state, action as never);
    expect(next.activeJob?.status).toBe('cancelled');
    expect(next.cancellingId).toBeNull();
  });

  it('не откатывает прогресс: устаревший ответ по тому же jobId с меньшим processed игнорируется', () => {
    const fresh: JobDetails = {
      ...details('current'),
      stats: { total: 3, pending: 0, inProgress: 0, success: 2, error: 0, cancelled: 0, processed: 2 },
    };
    const state = baseState({ activeJobId: 'current', activeJob: fresh });
    const stale = {
      ...details('current'),
      stats: { total: 3, pending: 1, inProgress: 1, success: 1, error: 0, cancelled: 0, processed: 1 },
    };
    const action = {
      type: fetchJobDetails.fulfilled.type,
      payload: stale,
      meta: { arg: 'current', requestId: 'x', requestStatus: 'fulfilled' },
    };
    const next = reducer(state, action as never);
    // Более старый ответ (processed=1) не должен затирать свежий (processed=2).
    expect(next.activeJob?.stats.processed).toBe(2);
  });
});
