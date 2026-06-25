import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import {
  CreateIncomeDto,
  IncomeQueryDto,
  UpdateIncomeDto,
} from './dto/income.dto';
import { AccountingService } from '../accounting/accounting.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IncomeRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(ctx: TenantContext, query: IncomeQueryDto) {
    const { skip, take, page, limit } = this.paginate(query);
    const where = {
      ...this.tenantWhere(ctx),
      deletedAt: null,
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.startDate &&
        query.endDate && {
          transactionDate: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        }),
      ...(query.search && {
        OR: [
          { sourceName: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    return Promise.all([
      this.prisma.income.findMany({
        where,
        skip,
        take,
        include: { category: true, branch: true, creator: { select: { id: true, name: true } } },
        orderBy: { transactionDate: query.sortOrder ?? 'desc' },
      }),
      this.prisma.income.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: this.buildMeta(total, page, limit),
    }));
  }

  findById(ctx: TenantContext, id: string) {
    return this.prisma.income.findFirst({
      where: { id, ...this.tenantWhere(ctx), deletedAt: null },
      include: { category: true, branch: true, journalEntry: true },
    });
  }

  findByLocalId(ctx: TenantContext, localId: string) {
    return this.prisma.income.findFirst({
      where: { localId, ...this.tenantWhere(ctx) },
    });
  }

  create(ctx: TenantContext, dto: CreateIncomeDto) {
    return this.prisma.income.create({
      data: {
        organizationId: ctx.organizationId,
        branchId: dto.branchId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        transactionDate: new Date(dto.transactionDate),
        sourceName: dto.sourceName,
        description: dto.description,
        attachmentUrl: dto.attachmentUrl,
        latitude: dto.latitude,
        longitude: dto.longitude,
        localId: dto.localId,
        createdBy: ctx.userId,
      },
      include: { category: true },
    });
  }

  update(ctx: TenantContext, id: string, dto: UpdateIncomeDto) {
    return this.prisma.income.update({
      where: { id, organizationId: ctx.organizationId },
      data: {
        ...dto,
        ...(dto.transactionDate && { transactionDate: new Date(dto.transactionDate) }),
        updatedBy: ctx.userId,
      },
      include: { category: true },
    });
  }

  softDelete(ctx: TenantContext, id: string) {
    return this.prisma.income.update({
      where: { id, organizationId: ctx.organizationId },
      data: { deletedAt: new Date(), updatedBy: ctx.userId },
    });
  }

  findCategory(organizationId: string, categoryId: string) {
    return this.prisma.incomeCategory.findFirst({
      where: { id: categoryId, organizationId, isActive: true },
    });
  }

  listCategories(organizationId: string) {
    return this.prisma.incomeCategory.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  sumByPeriod(ctx: TenantContext, start: Date, end: Date, branchId?: string) {
    return this.prisma.income.aggregate({
      where: {
        ...this.tenantWhere(ctx),
        deletedAt: null,
        transactionDate: { gte: start, lte: end },
        ...(branchId && { branchId }),
      },
      _sum: { amount: true },
    });
  }
}

@Injectable()
export class IncomeService {
  constructor(
    private incomeRepo: IncomeRepository,
    private accountingService: AccountingService,
    private auditService: AuditService,
  ) {}

  findAll(ctx: TenantContext, query: IncomeQueryDto) {
    return this.incomeRepo.findAll(ctx, query);
  }

  async findOne(ctx: TenantContext, id: string) {
    const income = await this.incomeRepo.findById(ctx, id);
    if (!income) throw new NotFoundException('Income not found');
    return income;
  }

  async create(ctx: TenantContext, dto: CreateIncomeDto) {
    if (dto.localId) {
      const existing = await this.incomeRepo.findByLocalId(ctx, dto.localId);
      if (existing) return existing;
    }

    await this.validateCategory(ctx.organizationId, dto.categoryId);

    const income = await this.incomeRepo.create(ctx, dto);
    await this.accountingService.createJournalFromIncome(
      ctx.organizationId,
      ctx.userId,
      income,
    );
    await this.auditService.log(ctx, 'CREATE', 'income', income.id, undefined, income);
    return income;
  }

  async update(ctx: TenantContext, id: string, dto: UpdateIncomeDto) {
    await this.findOne(ctx, id);
    if (dto.categoryId) {
      await this.validateCategory(ctx.organizationId, dto.categoryId);
    }
    const updated = await this.incomeRepo.update(ctx, id, dto);
    await this.auditService.log(ctx, 'UPDATE', 'income', id, undefined, updated);
    return updated;
  }

  async remove(ctx: TenantContext, id: string) {
    await this.findOne(ctx, id);
    await this.incomeRepo.softDelete(ctx, id);
    await this.auditService.log(ctx, 'DELETE', 'income', id);
    return { message: 'Income deleted' };
  }

  async summary(ctx: TenantContext, startDate: string, endDate: string, branchId?: string) {
    const result = await this.incomeRepo.sumByPeriod(
      ctx,
      new Date(startDate),
      new Date(endDate),
      branchId,
    );
    return { total: result._sum.amount ?? 0 };
  }

  listCategories(organizationId: string) {
    return this.incomeRepo.listCategories(organizationId);
  }

  private async validateCategory(organizationId: string, categoryId: string) {
    const cat = await this.incomeRepo.findCategory(organizationId, categoryId);
    if (!cat) throw new BadRequestException('Invalid income category');
  }
}
