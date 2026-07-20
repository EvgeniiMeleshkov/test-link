import { JobDetails, JobSummary } from '../types';
import { apiFetch } from './client';

// Слой работы с API заданий. Компоненты и стор зависят от этих функций,
// а не от деталей fetch.
export const jobsApi = {
  list: (): Promise<JobSummary[]> => apiFetch<JobSummary[]>('/jobs'),

  create: (urls: string[]): Promise<{ jobId: string }> =>
    apiFetch<{ jobId: string }>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),

  details: (id: string): Promise<JobDetails> => apiFetch<JobDetails>(`/jobs/${id}`),

  cancel: (id: string): Promise<JobDetails> =>
    apiFetch<JobDetails>(`/jobs/${id}`, { method: 'DELETE' }),
};
