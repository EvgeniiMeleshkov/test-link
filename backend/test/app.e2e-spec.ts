import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PROCESSING_CONFIG, ProcessingConfig } from '../src/jobs/config/processing.config';
import { UrlCheckerService } from '../src/jobs/url-checker.service';

const fastConfig: ProcessingConfig = {
  concurrency: 5,
  // Небольшая, но ненулевая задержка: обработка длится дольше HTTP round-trip,
  // что делает сценарий отмены детерминированным.
  delayMinMs: 60,
  delayMaxMs: 60,
  requestTimeoutMs: 1000,
};

// Заглушка сети: любой URL со словом "bad" считается ошибкой.
const urlCheckerStub = {
  check: jest.fn(async (url: string) =>
    url.includes('bad')
      ? { ok: false, httpStatus: 404, error: 'HTTP 404' }
      : { ok: true, httpStatus: 200, error: null },
  ),
};

async function waitForTerminal(
  app: INestApplication,
  jobId: string,
  timeoutMs = 2000,
): Promise<request.Response> {
  const deadline = Date.now() + timeoutMs;
  const terminal = ['completed', 'cancelled', 'failed'];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await request(app.getHttpServer()).get(`/api/jobs/${jobId}`);
    if (terminal.includes(res.body.status) || Date.now() > deadline) {
      return res;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe('Jobs API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UrlCheckerService)
      .useValue(urlCheckerStub)
      .overrideProvider(PROCESSING_CONFIG)
      .useValue(fastConfig)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/jobs создаёт задание', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://good.com', 'https://bad.com'] })
      .expect(201);

    expect(res.body.jobId).toBeDefined();
  });

  it('POST /api/jobs отклоняет некорректный ввод (400)', async () => {
    await request(app.getHttpServer()).post('/api/jobs').send({ urls: [] }).expect(400);
    await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['not-a-url'] })
      .expect(400);
    await request(app.getHttpServer()).post('/api/jobs').send({}).expect(400);
  });

  it('полный цикл: создание → обработка → детали со статистикой', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://good.com', 'https://bad.com', 'https://good2.com'] })
      .expect(201);

    const details = await waitForTerminal(app, create.body.jobId);
    expect(details.body.status).toBe('completed');
    expect(details.body.stats.success).toBe(2);
    expect(details.body.stats.error).toBe(1);
    expect(details.body.urls).toHaveLength(3);
  });

  it('GET /api/jobs возвращает список', async () => {
    const res = await request(app.getHttpServer()).get('/api/jobs').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('stats');
  });

  it('GET /api/jobs/:id возвращает 404 для неизвестного id', async () => {
    await request(app.getHttpServer()).get('/api/jobs/unknown-id').expect(404);
  });

  it('DELETE /api/jobs/:id отменяет задание', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: Array.from({ length: 8 }, (_, i) => `https://good-${i}.com`) })
      .expect(201);

    const res = await request(app.getHttpServer())
      .delete(`/api/jobs/${create.body.jobId}`)
      .expect(200);

    expect(res.body.status).toBe('cancelled');
  });
});
