import { ProcessingConfig } from './config/processing.config';
import { UrlCheckerService } from './url-checker.service';

const config: ProcessingConfig = {
  concurrency: 5,
  delayMinMs: 0,
  delayMaxMs: 0,
  requestTimeoutMs: 1000,
};

describe('UrlCheckerService', () => {
  let service: UrlCheckerService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    service = new UrlCheckerService(config);
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  it('возвращает success для ответа 2xx', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });

    const result = await service.check('https://example.com');

    expect(result).toEqual({ ok: true, httpStatus: 200, error: null });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('возвращает error с HTTP-статусом для ответа 4xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    const result = await service.check('https://example.com/missing');

    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(404);
    expect(result.error).toContain('404');
  });

  it('нормализует сетевую ошибку', async () => {
    const networkError = Object.assign(new Error('fetch failed'), {
      cause: { code: 'ENOTFOUND' },
    });
    fetchMock.mockRejectedValue(networkError);

    const result = await service.check('https://nonexistent.invalid');

    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBeNull();
    expect(result.error).toContain('ENOTFOUND');
  });
});
