import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { CsvGenerator } from './generators/csv.generator';
import { ExcelGenerator } from './generators/excel.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { ReportProcessor } from '../../jobs/processors/report.processor';
import { UploadModule } from '../upload/upload.module';
import { QUEUE_REPORTS } from '../../jobs/jobs.constants';

@Module({
  imports: [
    UploadModule,
    BullModule.registerQueue({ name: QUEUE_REPORTS }),
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    CsvGenerator,
    ExcelGenerator,
    PdfGenerator,
    ReportProcessor,
  ],
  exports: [ReportService],
})
export class ReportModule {}
