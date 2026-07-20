import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobDetailsResponse, JobSummaryResponse } from './dto/job-response';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /** Создать задание и запустить фоновую проверку URL. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateJobDto): { jobId: string } {
    return this.jobsService.create(dto);
  }

  /** Список заданий с краткой статистикой. */
  @Get()
  findAll(): JobSummaryResponse[] {
    return this.jobsService.findAll();
  }

  /** Детальная информация по заданию, включая статус каждого URL. */
  @Get(':id')
  findOne(@Param('id') id: string): JobDetailsResponse {
    return this.jobsService.findOne(id);
  }

  /** Отменить задание: прекращает обработку ещё не начатых URL. */
  @Delete(':id')
  cancel(@Param('id') id: string): JobDetailsResponse {
    return this.jobsService.cancel(id);
  }
}
