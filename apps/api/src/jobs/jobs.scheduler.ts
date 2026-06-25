import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  JOB_DAILY_TRANSACTION,
  JOB_EXPENSE_7DAY,
  JOB_INCOME_7DAY,
  JOB_MONTHLY_REPORT,
  JOB_TARGET_REMINDER,
  QUEUE_REMINDERS,
} from './jobs.constants';

@Injectable()
export class JobsScheduler implements OnModuleInit {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(QUEUE_REMINDERS) private remindersQueue: Queue,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.config.get<string>('JOBS_ENABLED', 'true') === 'true';
    if (!enabled) {
      this.logger.warn('Background jobs disabled (JOBS_ENABLED=false)');
      return;
    }

    try {
      await this.scheduleRepeatableJobs();
      this.logger.log('Repeatable jobs scheduled successfully');
    } catch (error) {
      this.logger.error(
        'Failed to schedule jobs — ensure Redis is running',
        error instanceof Error ? error.message : error,
      );
    }
  }

  private async scheduleRepeatableJobs() {
    const jobs = [
      {
        name: JOB_DAILY_TRANSACTION,
        pattern: '0 20 * * *',
        description: 'Daily at 20:00 — no transaction today',
      },
      {
        name: JOB_INCOME_7DAY,
        pattern: '0 9 * * 1',
        description: 'Every Monday 09:00 — no income in 7 days',
      },
      {
        name: JOB_EXPENSE_7DAY,
        pattern: '0 9 * * 3',
        description: 'Every Wednesday 09:00 — no expense in 7 days',
      },
      {
        name: JOB_TARGET_REMINDER,
        pattern: '0 8 * * *',
        description: 'Daily at 08:00 — target near deadline',
      },
      {
        name: JOB_MONTHLY_REPORT,
        pattern: '0 9 1 * *',
        description: '1st of month at 09:00 — monthly report reminder',
      },
    ];

    for (const job of jobs) {
      await this.remindersQueue.add(
        job.name,
        { description: job.description },
        {
          repeat: { pattern: job.pattern },
          jobId: job.name,
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      this.logger.log(`Scheduled: ${job.name} (${job.pattern})`);
    }
  }
}
