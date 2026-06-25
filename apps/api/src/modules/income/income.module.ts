import { Module } from '@nestjs/common';
import { IncomeController, IncomeCategoryController } from './income.controller';
import { IncomeService, IncomeRepository } from './income.service';
import { AccountingModule } from '../accounting/accounting.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AccountingModule, AuditModule],
  controllers: [IncomeController, IncomeCategoryController],
  providers: [IncomeService, IncomeRepository],
  exports: [IncomeService, IncomeRepository],
})
export class IncomeModule {}
