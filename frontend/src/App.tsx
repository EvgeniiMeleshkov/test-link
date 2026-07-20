import { useEffect } from 'react';
import { CreateJobForm } from './components/CreateJobForm';
import { JobDetails } from './components/JobDetails';
import { JobList } from './components/JobList';
import { useActiveJobPolling } from './hooks/useActiveJobPolling';
import { fetchJobs } from './store/jobsSlice';
import { useAppDispatch } from './store/hooks';

export function App() {
  const dispatch = useAppDispatch();

  // Загрузка списка при старте.
  useEffect(() => {
    void dispatch(fetchJobs());
  }, [dispatch]);

  // Опрос активного задания, пока оно не завершится.
  useActiveJobPolling();

  return (
    <div className="app">
      <header className="app__header">
        <h1>Проверка списка URL</h1>
        <p className="muted">Асинхронная проверка доступности URL через HEAD-запросы</p>
      </header>

      <main className="app__layout">
        <aside className="app__sidebar">
          <CreateJobForm />
          <JobList />
        </aside>
        <div className="app__main">
          <JobDetails />
        </div>
      </main>
    </div>
  );
}
