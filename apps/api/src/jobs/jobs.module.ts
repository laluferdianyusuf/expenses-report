import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_REMINDERS } from './jobs.constants';
import { ReminderProcessor } from './processors/reminder.processor';
import { RemindersService } from './reminders.service';
import { JobsScheduler } from './jobs.scheduler';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    BullModule.registerQueue({ name: QUEUE_REMINDERS }),
  ],
  providers: [RemindersService, ReminderProcessor, JobsScheduler],
  exports: [RemindersService],
})
export class JobsModule {}
