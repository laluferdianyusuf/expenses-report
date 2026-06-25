import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { IncomeModule } from '../income/income.module';
import { ExpenseModule } from '../expense/expense.module';

@Module({
  imports: [IncomeModule, ExpenseModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
