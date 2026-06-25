import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_GENERATE_REPORT, QUEUE_REPORTS } from '../jobs.constants';
import { ReportService } from '../../modules/report/report.service';

@Processor(QUEUE_REPORTS)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(private reportService: ReportService) {
    super();
  }

  async process(job: Job<{ reportId: string }>): Promise<unknown> {
    this.logger.log(`Processing report job: ${job.id}`);
    if (job.name === JOB_GENERATE_REPORT) {
      return this.reportService.processReport(job.data.reportId);
    }
    return null;
  }
}
