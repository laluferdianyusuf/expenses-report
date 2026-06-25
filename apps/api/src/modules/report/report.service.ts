import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.module';
import { R2Service } from '../upload/r2.service';
import { TenantContext } from '../../common/interfaces';
import { GenerateReportDto } from './dto/report.dto';
import { ReportData, ReportRow } from './generators/report-generator.interface';
import { CsvGenerator } from './generators/csv.generator';
import { ExcelGenerator } from './generators/excel.generator';
import { PdfGenerator } from './generators/pdf.generator';
import { QUEUE_REPORTS, JOB_GENERATE_REPORT } from '../../jobs/jobs.constants';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
    private csvGenerator: CsvGenerator,
    private excelGenerator: ExcelGenerator,
    private pdfGenerator: PdfGenerator,
    @InjectQueue(QUEUE_REPORTS) private reportsQueue: Queue,
  ) {}

  async requestGenerate(ctx: TenantContext, dto: GenerateReportDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const report = await this.prisma.report.create({
      data: {
        organizationId: ctx.organizationId,
        reportType: dto.reportType,
        period: 'CUSTOM',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        format: dto.format,
        status: 'PENDING',
        generatedBy: ctx.userId,
        parameters: {
          branchId: dto.branchId,
          organizationName: org.name,
        },
      },
    });

    await this.reportsQueue.add(
      JOB_GENERATE_REPORT,
      { reportId: report.id },
      { jobId: `report-${report.id}`, removeOnComplete: true },
    );

    return {
      id: report.id,
      status: report.status,
      message: 'Report generation queued',
    };
  }

  async processReport(reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { organization: true, generator: true },
    });
    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'PROCESSING' },
    });

    try {
      const params = (report.parameters as { branchId?: string }) ?? {};
      const data = await this.collectReportData(
        report.organizationId,
        report.reportType,
        report.startDate,
        report.endDate,
        report.organization.name,
        params.branchId,
      );

      const buffer = await this.generateBuffer(data, report.format);
      const extension = this.getExtension(report.format);
      const fileName = `report-${report.reportType.toLowerCase()}-${Date.now()}.${extension}`;
      const key = this.r2.buildKey(report.organizationId, 'reports', fileName);
      const mimeType = this.r2.getMimeTypeForFormat(report.format);

      let fileUrl: string;
      if (this.r2.isEnabled()) {
        fileUrl = await this.r2.uploadBuffer(key, buffer, mimeType);
      } else {
        fileUrl = `local://${key}`;
        this.logger.warn(`R2 disabled — report ${reportId} generated but not uploaded`);
      }

      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          completedAt: new Date(),
          parameters: {
            ...(params as object),
            r2Key: key,
            organizationName: report.organization.name,
          },
        },
      });

      this.logger.log(`Report ${reportId} generated successfully`);
      return { reportId, fileUrl };
    } catch (error) {
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  findAll(ctx: TenantContext, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    return Promise.all([
      this.prisma.report.findMany({
        where: { organizationId: ctx.organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { generator: { select: { id: true, name: true } } },
      }),
      this.prisma.report.count({ where: { organizationId: ctx.organizationId } }),
    ]).then(([data, total]) => ({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  }

  async findOne(ctx: TenantContext, id: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { generator: { select: { id: true, name: true } } },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async getDownloadUrl(ctx: TenantContext, id: string) {
    const report = await this.findOne(ctx, id);
    if (report.status !== 'COMPLETED' || !report.fileUrl) {
      throw new BadRequestException('Report not ready for download');
    }

    if (this.r2.isEnabled() && !report.fileUrl.startsWith('local://')) {
      const params = (report.parameters as { r2Key?: string }) ?? {};
      const key = params.r2Key;
      if (!key) throw new BadRequestException('Report file key not found');
      const downloadUrl = await this.r2.getPresignedDownloadUrl(key);
      return { downloadUrl, expiresIn: 3600 };
    }

    return { downloadUrl: report.fileUrl, expiresIn: 0 };
  }

  private async collectReportData(
    organizationId: string,
    reportType: string,
    startDate: Date,
    endDate: Date,
    organizationName: string,
    branchId?: string,
  ): Promise<ReportData> {
    const branchFilter = branchId ? { branchId } : {};
    const dateFilter = { gte: startDate, lte: endDate };
    const rows: ReportRow[] = [];

    const includeIncome = ['INCOME', 'MONTHLY', 'WEEKLY', 'DAILY', 'YEARLY', 'CASH_FLOW'].includes(
      reportType,
    );
    const includeExpense = ['EXPENSE', 'MONTHLY', 'WEEKLY', 'DAILY', 'YEARLY', 'CASH_FLOW'].includes(
      reportType,
    );

    if (includeIncome || reportType === 'INCOME') {
      const incomes = await this.prisma.income.findMany({
        where: {
          organizationId,
          deletedAt: null,
          transactionDate: dateFilter,
          ...branchFilter,
        },
        include: { category: true },
        orderBy: { transactionDate: 'asc' },
      });
      for (const i of incomes) {
        rows.push({
          date: i.transactionDate.toISOString().slice(0, 10),
          type: 'INCOME',
          category: i.category.name,
          description: i.sourceName ?? i.description ?? '',
          amount: Number(i.amount),
        });
      }
    }

    if (includeExpense || reportType === 'EXPENSE') {
      const expenses = await this.prisma.expense.findMany({
        where: {
          organizationId,
          deletedAt: null,
          transactionDate: dateFilter,
          ...(reportType === 'EXPENSE' ? {} : { status: 'APPROVED' as const }),
          ...branchFilter,
        },
        include: { category: true },
        orderBy: { transactionDate: 'asc' },
      });
      for (const e of expenses) {
        rows.push({
          date: e.transactionDate.toISOString().slice(0, 10),
          type: 'EXPENSE',
          category: e.category.name,
          description: e.vendorName ?? e.description ?? '',
          amount: Number(e.amount),
          status: e.status,
        });
      }
    }

    if (reportType === 'BUDGET') {
      const budgets = await this.prisma.budget.findMany({
        where: { organizationId, isActive: true },
        include: { category: true },
      });
      for (const b of budgets) {
        rows.push({
          date: b.startDate.toISOString().slice(0, 10),
          type: 'EXPENSE',
          category: b.category.name,
          description: `Budget: ${b.usedAmount}/${b.budgetAmount}`,
          amount: Number(b.usedAmount),
          status: b.alertLevel,
        });
      }
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));

    const totalIncome = rows
      .filter((r) => r.type === 'INCOME')
      .reduce((s, r) => s + r.amount, 0);
    const totalExpense = rows
      .filter((r) => r.type === 'EXPENSE')
      .reduce((s, r) => s + r.amount, 0);

    return {
      title: `FMS Report — ${reportType}`,
      organizationName,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      rows,
      summary: {
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense,
      },
    };
  }

  private generateBuffer(data: ReportData, format: string) {
    switch (format) {
      case 'PDF':
        return this.pdfGenerator.generate(data);
      case 'EXCEL':
        return this.excelGenerator.generate(data);
      case 'CSV':
        return this.csvGenerator.generate(data);
      default:
        throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }

  private getExtension(format: string) {
    switch (format) {
      case 'PDF':
        return 'pdf';
      case 'EXCEL':
        return 'xlsx';
      case 'CSV':
        return 'csv';
      default:
        return 'bin';
    }
  }
}
