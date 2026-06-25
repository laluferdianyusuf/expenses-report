import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import {
  CreateExpenseDto,
  ExpenseQueryDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { AuditService } from '../audit/audit.service';
import { ApprovalEntityType } from '@prisma/client';

@Injectable()
export class ExpenseRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(ctx: TenantContext, query: ExpenseQueryDto) {
    const { skip, take, page, limit } = this.paginate(query);
    const where = {
      ...this.tenantWhere(ctx),
      deletedAt: null,
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.status && { status: query.status }),
      ...(query.startDate &&
        query.endDate && {
          transactionDate: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        }),
      ...(query.search && {
        OR: [
          { vendorName: { contains: query.search, mode: 'insensitive' as const } },
          { description: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    return Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          branch: true,
          approvalFlow: true,
          creator: { select: { id: true, name: true } },
        },
        orderBy: { transactionDate: query.sortOrder ?? 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]).then(([data, total]) => ({
      data,
      meta: this.buildMeta(total, page, limit),
    }));
  }

  findById(ctx: TenantContext, id: string) {
    return this.prisma.expense.findFirst({
      where: { id, ...this.tenantWhere(ctx), deletedAt: null },
      include: { category: true, branch: true, approvalFlow: { include: { histories: true } } },
    });
  }

  findByLocalId(ctx: TenantContext, localId: string) {
    return this.prisma.expense.findFirst({
      where: { localId, ...this.tenantWhere(ctx) },
    });
  }

  create(ctx: TenantContext, dto: CreateExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          organizationId: ctx.organizationId,
          branchId: dto.branchId,
          categoryId: dto.categoryId,
          amount: dto.amount,
          transactionDate: new Date(dto.transactionDate),
          vendorName: dto.vendorName,
          description: dto.description,
          attachmentUrl: dto.attachmentUrl,
          latitude: dto.latitude,
          longitude: dto.longitude,
          localId: dto.localId,
          status: 'DRAFT',
          createdBy: ctx.userId,
        },
        include: { category: true },
      });

      await tx.approvalFlow.create({
        data: {
          organizationId: ctx.organizationId,
          entityType: ApprovalEntityType.EXPENSE,
          entityId: expense.id,
          expenseId: expense.id,
          status: 'DRAFT',
          submittedBy: ctx.userId,
        },
      });

      return expense;
    });
  }

  update(ctx: TenantContext, id: string, dto: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id, organizationId: ctx.organizationId },
      data: {
        ...dto,
        ...(dto.transactionDate && { transactionDate: new Date(dto.transactionDate) }),
        updatedBy: ctx.userId,
      },
      include: { category: true, approvalFlow: true },
    });
  }

  softDelete(ctx: TenantContext, id: string) {
    return this.prisma.expense.update({
      where: { id, organizationId: ctx.organizationId },
      data: { deletedAt: new Date(), updatedBy: ctx.userId },
    });
  }

  sumByPeriod(ctx: TenantContext, start: Date, end: Date, branchId?: string) {
    return this.prisma.expense.aggregate({
      where: {
        ...this.tenantWhere(ctx),
        deletedAt: null,
        status: 'APPROVED',
        transactionDate: { gte: start, lte: end },
        ...(branchId && { branchId }),
      },
      _sum: { amount: true },
    });
  }

  listCategories(organizationId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findCategory(organizationId: string, categoryId: string) {
    return this.prisma.expenseCategory.findFirst({
      where: { id: categoryId, organizationId, isActive: true },
    });
  }
}

@Injectable()
export class ExpenseService {
  constructor(
    private expenseRepo: ExpenseRepository,
    private auditService: AuditService,
  ) {}

  findAll(ctx: TenantContext, query: ExpenseQueryDto) {
    return this.expenseRepo.findAll(ctx, query);
  }

  async findOne(ctx: TenantContext, id: string) {
    const expense = await this.expenseRepo.findById(ctx, id);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(ctx: TenantContext, dto: CreateExpenseDto) {
    if (dto.localId) {
      const existing = await this.expenseRepo.findByLocalId(ctx, dto.localId);
      if (existing) return existing;
    }

    const cat = await this.expenseRepo.findCategory(ctx.organizationId, dto.categoryId);
    if (!cat) throw new BadRequestException('Invalid expense category');

    const expense = await this.expenseRepo.create(ctx, dto);
    await this.auditService.log(ctx, 'CREATE', 'expense', expense.id, undefined, expense);
    return expense;
  }

  async update(ctx: TenantContext, id: string, dto: UpdateExpenseDto) {
    const expense = await this.findOne(ctx, id);
    if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
      throw new BadRequestException('Only draft or rejected expenses can be edited');
    }
    const updated = await this.expenseRepo.update(ctx, id, dto);
    await this.auditService.log(ctx, 'UPDATE', 'expense', id, expense, updated);
    return updated;
  }

  async remove(ctx: TenantContext, id: string) {
    const expense = await this.findOne(ctx, id);
    if (expense.status === 'APPROVED') {
      throw new BadRequestException('Approved expenses cannot be deleted');
    }
    await this.expenseRepo.softDelete(ctx, id);
    await this.auditService.log(ctx, 'DELETE', 'expense', id);
    return { message: 'Expense deleted' };
  }

  async summary(ctx: TenantContext, startDate: string, endDate: string, branchId?: string) {
    const result = await this.expenseRepo.sumByPeriod(
      ctx,
      new Date(startDate),
      new Date(endDate),
      branchId,
    );
    return { total: result._sum.amount ?? 0 };
  }

  listCategories(organizationId: string) {
    return this.expenseRepo.listCategories(organizationId);
  }
}
