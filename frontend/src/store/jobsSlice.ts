import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jobsApi } from '../api/jobsApi';
import { JobDetails, JobSummary } from '../types';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface JobsState {
  list: JobSummary[];
  listStatus: RequestStatus;
  listError: string | null;

  activeJobId: string | null;
  activeJob: JobDetails | null;
  activeError: string | null;

  createStatus: RequestStatus;
  createError: string | null;

  /** id задания, которое сейчас отменяется (или null). */
  cancellingId: string | null;
}

const initialState: JobsState = {
  list: [],
  listStatus: 'idle',
  listError: null,
  activeJobId: null,
  activeJob: null,
  activeError: null,
  createStatus: 'idle',
  createError: null,
  cancellingId: null,
};

export const fetchJobs = createAsyncThunk('jobs/fetchList', () => jobsApi.list());

export const createJob = createAsyncThunk('jobs/create', (urls: string[]) =>
  jobsApi.create(urls),
);

export const fetchJobDetails = createAsyncThunk('jobs/fetchDetails', (id: string) =>
  jobsApi.details(id),
);

export const cancelJob = createAsyncThunk('jobs/cancel', (id: string) => jobsApi.cancel(id));

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    // Выбор активного задания. Сбрасываем детали и ошибку, чтобы не показывать
    // данные предыдущего задания до прихода новых.
    setActiveJob(state, action: PayloadAction<string>) {
      if (state.activeJobId === action.payload) {
        return;
      }
      state.activeJobId = action.payload;
      state.activeJob = null;
      state.activeError = null;
    },
    clearCreateError(state) {
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- список ----
      .addCase(fetchJobs.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.error.message ?? 'Не удалось загрузить список';
      })

      // ---- создание ----
      .addCase(createJob.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        // Новое задание становится активным.
        state.activeJobId = action.payload.jobId;
        state.activeJob = null;
        state.activeError = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.error.message ?? 'Не удалось создать задание';
      })

      // ---- детали активного задания ----
      .addCase(fetchJobDetails.fulfilled, (state, action) => {
        // КЛЮЧЕВОЕ: игнорируем ответы по неактивному (устаревшему) jobId.
        // Это гарантирует, что «хвост» опроса прошлого задания не меняет UI.
        if (action.payload.id !== state.activeJobId) {
          return;
        }
        // Защита от гонки ответов по ОДНОМУ заданию: параллельные запросы могут
        // прийти не по порядку. `processed` монотонно не убывает за жизнь задания,
        // поэтому более старый ответ (с меньшим processed) не должен перезаписывать
        // более свежий и «откатывать» прогресс назад.
        if (
          state.activeJob &&
          action.payload.stats.processed < state.activeJob.stats.processed
        ) {
          return;
        }
        state.activeJob = action.payload;
        state.activeError = null;
      })
      .addCase(fetchJobDetails.rejected, (state, action) => {
        if (action.meta.arg !== state.activeJobId) {
          return;
        }
        state.activeError = action.error.message ?? 'Не удалось загрузить детали';
      })

      // ---- отмена ----
      .addCase(cancelJob.pending, (state, action) => {
        state.cancellingId = action.meta.arg;
      })
      .addCase(cancelJob.fulfilled, (state, action) => {
        if (state.cancellingId === action.payload.id) {
          state.cancellingId = null;
        }
        if (action.payload.id === state.activeJobId) {
          state.activeJob = action.payload;
        }
      })
      .addCase(cancelJob.rejected, (state, action) => {
        if (state.cancellingId === action.meta.arg) {
          state.cancellingId = null;
        }
        if (action.meta.arg === state.activeJobId) {
          state.activeError = action.error.message ?? 'Не удалось отменить задание';
        }
      });
  },
});

export const { setActiveJob, clearCreateError } = jobsSlice.actions;
export default jobsSlice.reducer;
