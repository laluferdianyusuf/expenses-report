import { Module } from '@nestjs/common';
import { ExpenseController, ExpenseCategoryController } from './expense.controller';
import { ExpenseService, ExpenseRepository } from './expense.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ExpenseController, ExpenseCategoryController],
  providers: [ExpenseService, ExpenseRepository],
  exports: [ExpenseService, ExpenseRepository],
})
export class ExpenseModule {}
