import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jobsApi } from '../api/jobsApi';
import jobsReducer from '../store/jobsSlice';
import { JobStatus, JobSummary } from '../types';
import { useJobsListPolling } from './useJobsListPolling';

vi.mock('../api/jobsApi', () => ({
  jobsApi: {
    list: vi.fn(),
    details: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
  },
}));

const listMock = jobsApi.list as ReturnType<typeof vi.fn>;

function summary(id: string, status: JobStatus): JobSummary {
  return {
    id,
    createdAt: '2026-07-20T10:00:00.000Z',
    status,
    stats: { total: 1, pending: 0, inProgress: 1, success: 0, error: 0, cancelled: 0, processed: 0 },
  };
}

function makeStore(initialList: JobSummary[]) {
  const store = configureStore({ reducer: { jobs: jobsReducer } });
  // Засеваем список через успешный thunk-экшен.
  store.dispatch({ type: 'jobs/fetchList/fulfilled', payload: initialList });
  return store;
}

function wrapperFor(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  vi.clearAllMocks();
});

describe('useJobsListPolling', () => {
  it('опрашивает список, пока есть незавершённые задания', async () => {
    listMock.mockResolvedValue([summary('j1', 'in_progress')]);
    const store = makeStore([summary('j1', 'in_progress')]);

    renderHook(() => useJobsListPolling(20), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(listMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('не опрашивает, когда все задания завершены', async () => {
    listMock.mockResolvedValue([summary('j1', 'completed')]);
    const store = makeStore([summary('j1', 'completed')]);

    renderHook(() => useJobsListPolling(20), { wrapper: wrapperFor(store) });

    await sleep(120);
    expect(listMock).not.toHaveBeenCalled();
  });
});
