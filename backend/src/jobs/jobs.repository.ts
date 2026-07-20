import { Injectable } from '@nestjs/common';
import { Job } from './domain/job.types';

/**
 * In-memory хранилище заданий.
 * Инкапсулирует Map, чтобы остальной код зависел от интерфейса, а не от структуры хранения
 * (при необходимости заменяется на реализацию поверх БД без изменений в сервисе).
 */
@Injectable()
export class JobsRepository {
  private readonly jobs = new Map<string, Job>();

  save(job: Job): Job {
    this.jobs.set(job.id, job);
    return job;
  }

  findById(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Все задания, новые — первыми.
   * Map сохраняет порядок вставки, поэтому reverse() даёт детерминированный порядок
   * даже когда несколько заданий создаются в одну миллисекунду.
   */
  findAll(): Job[] {
    return Array.from(this.jobs.values()).reverse();
  }
}
