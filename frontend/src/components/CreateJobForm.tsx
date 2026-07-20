import { FormEvent, useState } from 'react';
import { clearCreateError, createJob, fetchJobs } from '../store/jobsSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

// Разбивает текст textarea на список URL: по строкам, без пустых и с обрезкой пробелов.
function parseUrls(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function CreateJobForm() {
  const dispatch = useAppDispatch();
  const createStatus = useAppSelector((state) => state.jobs.createStatus);
  const createError = useAppSelector((state) => state.jobs.createError);
  const [text, setText] = useState('');

  const urls = parseUrls(text);
  const isSubmitting = createStatus === 'loading';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (urls.length === 0 || isSubmitting) {
      return;
    }
    const result = await dispatch(createJob(urls));
    if (createJob.fulfilled.match(result)) {
      setText('');
      void dispatch(fetchJobs());
    }
  };

  return (
    <form className="card create-form" onSubmit={handleSubmit}>
      <h2>Новая проверка</h2>
      <label htmlFor="urls-input" className="create-form__label">
        Список URL — по одному в строке:
      </label>
      <textarea
        id="urls-input"
        className="create-form__textarea"
        rows={8}
        placeholder={'https://example.com\nhttps://github.com'}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          if (createError) {
            dispatch(clearCreateError());
          }
        }}
        disabled={isSubmitting}
      />

      <div className="create-form__footer">
        <span className="create-form__counter">Найдено URL: {urls.length}</span>
        <button type="submit" className="button button--primary" disabled={urls.length === 0 || isSubmitting}>
          {isSubmitting ? 'Запуск…' : 'Запустить проверку'}
        </button>
      </div>

      {createError && <p className="error-text" role="alert">{createError}</p>}
    </form>
  );
}
