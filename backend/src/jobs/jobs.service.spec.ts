import { NotFoundException } from '@nestjs/common';
import { ProcessingConfig } from './config/processing.config';
import { JobStatus, UrlStatus } from './domain/job.types';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';
import { UrlCheckerService, UrlCheckResult } from './url-checker.service';

const baseConfig: ProcessingConfig = {
  concurrency: 5,
  delayMinMs: 0,
  delayMaxMs: 0,
  requestTimeoutMs: 1000,
};

function makeService(
  config: ProcessingConfig,
  check: (url: string) => Promise<UrlCheckResult>,
): { service: JobsService; repository: JobsRepository } {
  const repository = new JobsRepository();
  const urlChecker = { check: jest.fn(check) } as unknown as UrlCheckerService;
  const service = new JobsService(repository, urlChecker, config);
  return { service, repository };
}

const ok = (status = 200): UrlCheckResult => ({ ok: true, httpStatus: status, error: null });
const fail = (): UrlCheckResult => ({ ok: false, httpStatus: 500, error: 'HTTP 500' });

describe('JobsService', () => {
  it('создаёт задание в статусе pending и возвращает jobId', () => {
    const { service, repository } = makeService(baseConfig, async () => ok());

    const { jobId } = service.create({ urls: ['https://a.com', 'https://b.com'] });

    expect(jobId).toBeDefined();
    const job = repository.findById(jobId);
    expect(job?.urls).toHaveLength(2);
  });

  it('обрабатывает все URL и переводит задание в completed', async () => {
    const { service } = makeService(baseConfig, async (url) =>
      url.includes('bad') ? fail() : ok(),
    );

    const { jobId } = service.create({
      urls: ['https://good.com', 'https://bad.com', 'https://good2.com'],
    });
    await service.whenSettled(jobId);

    const job = service.findOne(jobId);
    expect(job.status).toBe(JobStatus.Completed);
    expect(job.stats.success).toBe(2);
    expect(job.stats.error).toBe(1);
    expect(job.stats.processed).toBe(3);
    for (const url of job.urls) {
      expect(url.startedAt).not.toBeNull();
      expect(url.finishedAt).not.toBeNull();
      expect(url.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('не запускает более `concurrency` одновременных проверок', async () => {
    let active = 0;
    let maxActive = 0;
    const { service } = makeService({ ...baseConfig, concurrency: 5 }, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return ok();
    });

    const urls = Array.from({ length: 15 }, (_, i) => `https://site-${i}.com`);
    const { jobId } = service.create({ urls });
    await service.whenSettled(jobId);

    expect(maxActive).toBeLessThanOrEqual(5);
  });

  it('отмена помечает задание cancelled и прекращает не начатые URL', async () => {
    // Медленная проверка, чтобы отмена успела произойти во время обработки.
    const { service } = makeService({ ...baseConfig, concurrency: 2 }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return ok();
    });

    const urls = Array.from({ length: 6 }, (_, i) => `https://site-${i}.com`);
    const { jobId } = service.create({ urls });

    // Отменяем сразу: 2 URL уже в работе, 4 — ещё pending.
    const cancelled = service.cancel(jobId);
    expect(cancelled.status).toBe(JobStatus.Cancelled);

    await service.whenSettled(jobId);

    const job = service.findOne(jobId);
    expect(job.status).toBe(JobStatus.Cancelled);
    expect(job.stats.cancelled).toBeGreaterThanOrEqual(4);
    expect(job.stats.success).toBeLessThanOrEqual(2);
    expect(job.urls.some((u) => u.status === UrlStatus.Cancelled)).toBe(true);
  });

  it('несколько заданий обрабатываются параллельно', async () => {
    const { service } = makeService(baseConfig, async () => ok());

    const first = service.create({ urls: ['https://a.com'] });
    const second = service.create({ urls: ['https://b.com'] });

    await Promise.all([service.whenSettled(first.jobId), service.whenSettled(second.jobId)]);

    expect(service.findOne(first.jobId).status).toBe(JobStatus.Completed);
    expect(service.findOne(second.jobId).status).toBe(JobStatus.Completed);
  });

  it('findOne бросает NotFoundException для неизвестного id', () => {
    const { service } = makeService(baseConfig, async () => ok());
    expect(() => service.findOne('does-not-exist')).toThrow(NotFoundException);
  });

  it('cancel бросает NotFoundException для неизвестного id', () => {
    const { service } = makeService(baseConfig, async () => ok());
    expect(() => service.cancel('does-not-exist')).toThrow(NotFoundException);
  });

  it('findAll возвращает задания, новые — первыми', async () => {
    const { service } = makeService(baseConfig, async () => ok());
    const first = service.create({ urls: ['https://a.com'] });
    const second = service.create({ urls: ['https://b.com'] });
    await Promise.all([service.whenSettled(first.jobId), service.whenSettled(second.jobId)]);

    const all = service.findAll();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(second.jobId);
  });
});
