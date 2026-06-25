import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  JOB_DAILY_TRANSACTION,
  JOB_EXPENSE_7DAY,
  JOB_INCOME_7DAY,
  JOB_MONTHLY_REPORT,
  JOB_TARGET_REMINDER,
  QUEUE_REMINDERS,
} from '../jobs.constants';
import { RemindersService } from '../reminders.service';

@Processor(QUEUE_REMINDERS)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private remindersService: RemindersService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Processing job: ${job.name} [${job.id}]`);

    switch (job.name) {
      case JOB_DAILY_TRANSACTION:
        return this.remindersService.dailyTransactionReminder();
      case JOB_INCOME_7DAY:
        return this.remindersService.income7DayReminder();
      case JOB_EXPENSE_7DAY:
        return this.remindersService.expense7DayReminder();
      case JOB_TARGET_REMINDER:
        return this.remindersService.targetReminder();
      case JOB_MONTHLY_REPORT:
        return this.remindersService.monthlyReportReminder();
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
        return null;
    }
  }
}
