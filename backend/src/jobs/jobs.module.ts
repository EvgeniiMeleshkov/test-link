import { Module } from '@nestjs/common';
import { loadProcessingConfig, PROCESSING_CONFIG } from './config/processing.config';
import { JobsController } from './jobs.controller';
import { JobsRepository } from './jobs.repository';
import { JobsService } from './jobs.service';
import { UrlCheckerService } from './url-checker.service';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsRepository,
    UrlCheckerService,
    {
      provide: PROCESSING_CONFIG,
      useFactory: () => loadProcessingConfig(),
    },
  ],
})
export class JobsModule {}
