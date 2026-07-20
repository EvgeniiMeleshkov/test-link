import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString, IsUrl } from 'class-validator';

const MAX_URLS_PER_JOB = 1000;

/**
 * Тело запроса POST /api/jobs.
 * Валидация выполняется глобальным ValidationPipe (whitelist + transform).
 */
export class CreateJobDto {
  @IsArray({ message: 'Поле "urls" должно быть массивом' })
  @ArrayNotEmpty({ message: 'Список URL не может быть пустым' })
  @ArrayMaxSize(MAX_URLS_PER_JOB, {
    message: `За один раз можно проверить не более ${MAX_URLS_PER_JOB} URL`,
  })
  @IsString({ each: true, message: 'Каждый URL должен быть строкой' })
  @IsUrl(
    { require_protocol: true, require_tld: false, protocols: ['http', 'https'] },
    { each: true, message: 'Каждый элемент должен быть корректным http/https URL' },
  )
  urls!: string[];
}
