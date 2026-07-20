import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jobsApi } from '../api/jobsApi';
import jobsReducer, { setActiveJob } from '../store/jobsSlice';
import { JobDetails, JobStatus } from '../types';
import { useActiveJobPolling } from './useActiveJobPolling';

vi.mock('../api/jobsApi', () => ({
  jobsApi: {
    details: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    cancel: vi.fn(),
  },
}));

const detailsMock = jobsApi.details as ReturnType<typeof vi.fn>;

function jobDetails(id: string, status: JobStatus): JobDetails {
  return {
    id,
    createdAt: '2026-07-20T10:00:00.000Z',
    status,
    stats: { total: 1, pending: 0, inProgress: 1, success: 0, error: 0, cancelled: 0, processed: 0 },
    urls: [],
  };
}

function makeStore() {
  return configureStore({ reducer: { jobs: jobsReducer } });
}

function wrapperFor(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
}

const callsFor = (id: string) => detailsMock.mock.calls.filter((c) => c[0] === id).length;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

afterEach(() => {
  vi.clearAllMocks();
});

describe('useActiveJobPolling', () => {
  it('периодически опрашивает активное задание, пока статус не конечный', async () => {
    detailsMock.mockResolvedValue(jobDetails('j1', 'in_progress'));
    const store = makeStore();
    store.dispatch(setActiveJob('j1'));

    renderHook(() => useActiveJobPolling(20), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(callsFor('j1')).toBeGreaterThanOrEqual(3));
    expect(detailsMock).toHaveBeenCalledWith('j1');
  });

  it('прекращает опрос при достижении конечного статуса', async () => {
    detailsMock.mockResolvedValue(jobDetails('j1', 'completed'));
    const store = makeStore();
    store.dispatch(setActiveJob('j1'));

    renderHook(() => useActiveJobPolling(20), { wrapper: wrapperFor(store) });

    await waitFor(() => expect(store.getState().jobs.activeJob?.status).toBe('completed'));
    await sleep(120);
    const stabilized = callsFor('j1');
    await sleep(120);
    // После конечного статуса новых запросов быть не должно.
    expect(callsFor('j1')).toBe(stabilized);
  });

  it('останавливает опрос предыдущего задания при смене активного', async () => {
    detailsMock.mockImplementation((id: string) => Promise.resolve(jobDetails(id, 'in_progress')));
    const store = makeStore();
    store.dispatch(setActiveJob('old'));

    renderHook(() => useActiveJobPolling(20), { wrapper: wrapperFor(store) });
    await waitFor(() => expect(callsFor('old')).toBeGreaterThanOrEqual(1));

    store.dispatch(setActiveJob('new'));
    await waitFor(() => expect(callsFor('new')).toBeGreaterThanOrEqual(1));

    const oldAfterSwitch = callsFor('old');
    await sleep(120);
    // Старый jobId больше не опрашивается.
    expect(callsFor('old')).toBe(oldAfterSwitch);
  });
});
