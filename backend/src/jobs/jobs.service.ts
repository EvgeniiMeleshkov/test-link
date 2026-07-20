import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PROCESSING_CONFIG, ProcessingConfig } from './config/processing.config';
import { CreateJobDto } from './dto/create-job.dto';
import {
  JobDetailsResponse,
  JobSummaryResponse,
  toDetails,
  toSummary,
} from './dto/job-response';
import { Job, JobStatus, TERMINAL_JOB_STATUSES, UrlCheck, UrlStatus } from './domain/job.types';
import { JobsRepository } from './jobs.repository';
import { UrlCheckerService } from './url-checker.service';
import { runWithConcurrency } from './utils/concurrency';
import { delay, randomDelayMs } from './utils/delay';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  /** Токены отмены по jobId (живут, пока задание в обработке). */
  private readonly controllers = new Map<string, AbortController>();
  /** Промисы фоновой обработки — нужны для ожидания в тестах и graceful shutdown. */
  private readonly processing = new Map<string, Promise<void>>();

  constructor(
    private readonly repository: JobsRepository,
    private readonly urlChecker: UrlCheckerService,
    @Inject(PROCESSING_CONFIG) private readonly config: ProcessingConfig,
  ) {}

  create(dto: CreateJobDto): { jobId: string } {
    const job = this.buildJob(dto.urls);
    this.repository.save(job);

    const controller = new AbortController();
    this.controllers.set(job.id, controller);

    // Обработка запускается в фоне; ответ клиенту не ждёт её завершения.
    const task = this.process(job, controller).finally(() => this.processing.delete(job.id));
    this.processing.set(job.id, task);

    return { jobId: job.id };
  }

  findAll(): JobSummaryResponse[] {
    return this.repository.findAll().map(toSummary);
  }

  findOne(id: string): JobDetailsResponse {
    return toDetails(this.getOrThrow(id));
  }

  cancel(id: string): JobDetailsResponse {
    const job = this.getOrThrow(id);

    if (TERMINAL_JOB_STATUSES.has(job.status)) {
      // Задание уже завершено/отменено — операция идемпотентна.
      return toDetails(job);
    }

    job.status = JobStatus.Cancelled;
    this.controllers.get(id)?.abort();
    // Мгновенно помечаем ещё не начатые URL как отменённые (для отзывчивого UI).
    this.markPendingAsCancelled(job);

    return toDetails(job);
  }

  /** Возвращает промис фоновой обработки задания (для тестов/ожидания). */
  whenSettled(id: string): Promise<void> | undefined {
    return this.processing.get(id);
  }

  private buildJob(urls: readonly string[]): Job {
    return {
      id: randomUUID(),
      createdAt: new Date(),
      status: JobStatus.Pending,
      urls: urls.map<UrlCheck>((url) => ({
        id: randomUUID(),
        url,
        status: UrlStatus.Pending,
        httpStatus: null,
        error: null,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
      })),
    };
  }

  private async process(job: Job, controller: AbortController): Promise<void> {
    // Задание могли отменить ещё до старта обработки.
    if (job.status !== JobStatus.Pending) {
      this.markPendingAsCancelled(job);
      this.controllers.delete(job.id);
      return;
    }

    job.status = JobStatus.InProgress;

    try {
      await runWithConcurrency(job.urls, this.config.concurrency, async (urlCheck) => {
        // Отмена прекращает обработку ещё не начатых URL; начатые доводятся до конца.
        if (controller.signal.aborted) {
          this.markCancelled(urlCheck);
          return;
        }
        await this.processUrl(urlCheck);
      });

      if (job.status === JobStatus.InProgress) {
        job.status = JobStatus.Completed;
      }
    } catch (error) {
      this.logger.error(`Задание ${job.id} завершилось с ошибкой`, error as Error);
      job.status = JobStatus.Failed;
    } finally {
      this.controllers.delete(job.id);
      this.markPendingAsCancelled(job);
    }
  }

  private async processUrl(urlCheck: UrlCheck): Promise<void> {
    urlCheck.status = UrlStatus.InProgress;
    urlCheck.startedAt = new Date();

    const result = await this.urlChecker.check(urlCheck.url);

    // Искусственная задержка перед сохранением результата (0–10 с по умолчанию).
    await delay(randomDelayMs(this.config.delayMinMs, this.config.delayMaxMs));

    urlCheck.finishedAt = new Date();
    urlCheck.durationMs = urlCheck.finishedAt.getTime() - urlCheck.startedAt.getTime();
    urlCheck.httpStatus = result.httpStatus;
    urlCheck.error = result.error;
    urlCheck.status = result.ok ? UrlStatus.Success : UrlStatus.Error;
  }

  private markCancelled(urlCheck: UrlCheck): void {
    if (urlCheck.status === UrlStatus.Pending) {
      urlCheck.status = UrlStatus.Cancelled;
    }
  }

  private markPendingAsCancelled(job: Job): void {
    for (const urlCheck of job.urls) {
      this.markCancelled(urlCheck);
    }
  }

  private getOrThrow(id: string): Job {
    const job = this.repository.findById(id);
    if (!job) {
      throw new NotFoundException(`Задание с id "${id}" не найдено`);
    }
    return job;
  }
}
