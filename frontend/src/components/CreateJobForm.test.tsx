import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import jobsReducer from '../store/jobsSlice';
import { jobsApi } from '../api/jobsApi';
import { CreateJobForm } from './CreateJobForm';

vi.mock('../api/jobsApi', () => ({
  jobsApi: {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    details: vi.fn(),
    cancel: vi.fn(),
  },
}));

function renderForm() {
  const store = configureStore({ reducer: { jobs: jobsReducer } });
  render(
    <Provider store={store}>
      <CreateJobForm />
    </Provider>,
  );
  return store;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('CreateJobForm', () => {
  it('считает количество непустых URL из textarea', async () => {
    renderForm();
    const textarea = screen.getByLabelText(/Список URL/i);
    await userEvent.type(textarea, 'https://a.com\n\nhttps://b.com\n   ');
    expect(screen.getByText('Найдено URL: 2')).toBeInTheDocument();
  });

  it('кнопка отправки заблокирована при пустом вводе', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /Запустить проверку/i })).toBeDisabled();
  });

  it('отправляет распарсенные URL и делает задание активным', async () => {
    (jobsApi.create as ReturnType<typeof vi.fn>).mockResolvedValue({ jobId: 'job-123' });
    const store = renderForm();

    await userEvent.type(screen.getByLabelText(/Список URL/i), 'https://a.com\nhttps://b.com');
    await userEvent.click(screen.getByRole('button', { name: /Запустить проверку/i }));

    expect(jobsApi.create).toHaveBeenCalledWith(['https://a.com', 'https://b.com']);
    expect(store.getState().jobs.activeJobId).toBe('job-123');
  });
});
