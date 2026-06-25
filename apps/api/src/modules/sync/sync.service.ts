import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { IncomeService } from '../income/income.service';
import { ExpenseService } from '../expense/expense.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../income/dto/income.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../expense/dto/expense.dto';
import {
  ResolveConflictDto,
  SyncAction,
  SyncEntityType,
  SyncItemDto,
  SyncPushDto,
} from './dto/sync.dto';

export interface SyncResultItem {
  localId: string;
  serverId: string;
  entityType: SyncEntityType;
  action: SyncAction;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private incomeService: IncomeService,
    private expenseService: ExpenseService,
  ) {}

  async push(ctx: TenantContext, dto: SyncPushDto) {
    const startedAt = new Date();
    const results: SyncResultItem[] = [];
    let itemsSynced = 0;
    let itemsFailed = 0;

    for (const item of dto.items) {
      try {
        const result = await this.processItem(ctx, item);
        results.push({ ...result, status: 'SUCCESS' });
        itemsSynced++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          localId: item.entityId,
          serverId: '',
          entityType: item.entityType,
          action: item.action,
          status: 'FAILED',
          error: message,
        });
        itemsFailed++;
      }
    }

    const syncLog = await this.prisma.syncLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        deviceId: dto.deviceId,
        itemsSynced,
        itemsFailed,
        details: JSON.parse(JSON.stringify({ results })) as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action: 'SYNC',
        entity: 'sync',
        entityId: syncLog.id,
        newData: { itemsSynced, itemsFailed } as Prisma.InputJsonValue,
      },
    });

    return {
      syncLogId: syncLog.id,
      itemsSynced,
      itemsFailed,
      results,
      startedAt,
      completedAt: syncLog.completedAt,
    };
  }

  async pull(ctx: TenantContext, since: Date, entities?: string[]) {
    const entitySet = new Set(
      (entities ?? ['income', 'expense', 'notification', 'categories']).map((e) =>
        e.trim().toLowerCase(),
      ),
    );

    const response: Record<string, unknown> = { since: since.toISOString() };

    if (entitySet.has('income')) {
      response.incomes = await this.prisma.income.findMany({
        where: {
          organizationId: ctx.organizationId,
          updatedAt: { gt: since },
        },
        include: { category: true },
        orderBy: { updatedAt: 'asc' },
      });
    }

    if (entitySet.has('expense')) {
      response.expenses = await this.prisma.expense.findMany({
        where: {
          organizationId: ctx.organizationId,
          updatedAt: { gt: since },
        },
        include: { category: true, approvalFlow: true },
        orderBy: { updatedAt: 'asc' },
      });
    }

    if (entitySet.has('notification')) {
      response.notifications = await this.prisma.notification.findMany({
        where: {
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          createdAt: { gt: since },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (entitySet.has('categories')) {
      const [incomeCategories, expenseCategories] = await Promise.all([
        this.prisma.incomeCategory.findMany({
          where: { organizationId: ctx.organizationId },
        }),
        this.prisma.expenseCategory.findMany({
          where: { organizationId: ctx.organizationId },
        }),
      ]);
      response.incomeCategories = incomeCategories;
      response.expenseCategories = expenseCategories;
    }

    return response;
  }

  async getStatus(ctx: TenantContext, deviceId: string) {
    const lastSync = await this.prisma.syncLog.findFirst({
      where: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        deviceId,
      },
      orderBy: { startedAt: 'desc' },
    });

    return {
      deviceId,
      lastSyncAt: lastSync?.completedAt ?? null,
      lastSyncStatus: lastSync
        ? lastSync.itemsFailed > 0
          ? 'PARTIAL'
          : 'SUCCESS'
        : 'NEVER',
      itemsSynced: lastSync?.itemsSynced ?? 0,
      itemsFailed: lastSync?.itemsFailed ?? 0,
    };
  }

  async resolveConflict(ctx: TenantContext, dto: ResolveConflictDto) {
    if (dto.resolution === 'SERVER') {
      const record = await this.findRecord(ctx, dto.entityType, dto.entityId);
      if (!record) throw new NotFoundException('Entity not found on server');
      return { resolution: 'SERVER', data: record };
    }

    if (!dto.clientPayload) {
      throw new BadRequestException('clientPayload required for CLIENT resolution');
    }

    const item: SyncItemDto = {
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: SyncAction.UPDATE,
      payload: dto.clientPayload,
      clientTimestamp: new Date().toISOString(),
    };

    const result = await this.processItem(ctx, item);
    return { resolution: 'CLIENT', ...result };
  }

  private async processItem(ctx: TenantContext, item: SyncItemDto) {
    switch (item.entityType) {
      case SyncEntityType.INCOME:
        return this.processIncome(ctx, item);
      case SyncEntityType.EXPENSE:
        return this.processExpense(ctx, item);
      default:
        throw new BadRequestException(`Unsupported entity type: ${item.entityType}`);
    }
  }

  private async processIncome(ctx: TenantContext, item: SyncItemDto) {
    switch (item.action) {
      case SyncAction.CREATE: {
        const dto = this.toCreateIncomeDto(item);
        const income = await this.incomeService.create(ctx, dto);
        return {
          localId: item.entityId,
          serverId: income.id,
          entityType: item.entityType,
          action: item.action,
        };
      }
      case SyncAction.UPDATE: {
        const serverId = await this.resolveServerId(ctx, SyncEntityType.INCOME, item);
        const dto = this.toUpdateIncomeDto(item.payload);
        const income = await this.incomeService.update(ctx, serverId, dto);
        return {
          localId: item.entityId,
          serverId: income.id,
          entityType: item.entityType,
          action: item.action,
        };
      }
      case SyncAction.DELETE: {
        const serverId = await this.resolveServerId(ctx, SyncEntityType.INCOME, item);
        await this.incomeService.remove(ctx, serverId);
        return {
          localId: item.entityId,
          serverId,
          entityType: item.entityType,
          action: item.action,
        };
      }
      default:
        throw new BadRequestException(`Unsupported action: ${item.action}`);
    }
  }

  private async processExpense(ctx: TenantContext, item: SyncItemDto) {
    switch (item.action) {
      case SyncAction.CREATE: {
        const dto = this.toCreateExpenseDto(item);
        const expense = await this.expenseService.create(ctx, dto);
        return {
          localId: item.entityId,
          serverId: expense.id,
          entityType: item.entityType,
          action: item.action,
        };
      }
      case SyncAction.UPDATE: {
        const serverId = await this.resolveServerId(ctx, SyncEntityType.EXPENSE, item);
        const dto = this.toUpdateExpenseDto(item.payload);
        const expense = await this.expenseService.update(ctx, serverId, dto);
        return {
          localId: item.entityId,
          serverId: expense.id,
          entityType: item.entityType,
          action: item.action,
        };
      }
      case SyncAction.DELETE: {
        const serverId = await this.resolveServerId(ctx, SyncEntityType.EXPENSE, item);
        await this.expenseService.remove(ctx, serverId);
        return {
          localId: item.entityId,
          serverId,
          entityType: item.entityType,
          action: item.action,
        };
      }
      default:
        throw new BadRequestException(`Unsupported action: ${item.action}`);
    }
  }

  private async resolveServerId(
    ctx: TenantContext,
    entityType: SyncEntityType,
    item: SyncItemDto,
  ): Promise<string> {
    const payloadServerId = item.payload.serverId as string | undefined;
    if (payloadServerId) return payloadServerId;

    const byLocal = await this.findRecord(ctx, entityType, item.entityId);
    if (byLocal) return byLocal.id;

    const byId = await this.findRecordById(ctx, entityType, item.entityId);
    if (byId) return byId.id;

    throw new NotFoundException(`Cannot resolve server ID for ${item.entityId}`);
  }

  private findRecord(ctx: TenantContext, entityType: SyncEntityType, localId: string) {
    if (entityType === SyncEntityType.INCOME) {
      return this.prisma.income.findFirst({
        where: { organizationId: ctx.organizationId, localId },
      });
    }
    return this.prisma.expense.findFirst({
      where: { organizationId: ctx.organizationId, localId },
    });
  }

  private findRecordById(ctx: TenantContext, entityType: SyncEntityType, id: string) {
    if (entityType === SyncEntityType.INCOME) {
      return this.prisma.income.findFirst({
        where: { id, organizationId: ctx.organizationId },
      });
    }
    return this.prisma.expense.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
  }

  private toCreateIncomeDto(item: SyncItemDto): CreateIncomeDto {
    const p = item.payload;
    return {
      branchId: p.branchId as string | undefined,
      categoryId: p.categoryId as string,
      amount: Number(p.amount),
      transactionDate: (p.transactionDate as string) ?? item.clientTimestamp,
      sourceName: p.sourceName as string | undefined,
      description: p.description as string | undefined,
      attachmentUrl: p.attachmentUrl as string | undefined,
      latitude: p.latitude as number | undefined,
      longitude: p.longitude as number | undefined,
      localId: item.entityId,
    };
  }

  private toUpdateIncomeDto(payload: Record<string, unknown>): UpdateIncomeDto {
    return {
      branchId: payload.branchId as string | undefined,
      categoryId: payload.categoryId as string | undefined,
      amount: payload.amount !== undefined ? Number(payload.amount) : undefined,
      transactionDate: payload.transactionDate as string | undefined,
      sourceName: payload.sourceName as string | undefined,
      description: payload.description as string | undefined,
      attachmentUrl: payload.attachmentUrl as string | undefined,
    };
  }

  private toCreateExpenseDto(item: SyncItemDto): CreateExpenseDto {
    const p = item.payload;
    return {
      branchId: p.branchId as string | undefined,
      categoryId: p.categoryId as string,
      amount: Number(p.amount),
      transactionDate: (p.transactionDate as string) ?? item.clientTimestamp,
      vendorName: p.vendorName as string | undefined,
      description: p.description as string | undefined,
      attachmentUrl: p.attachmentUrl as string | undefined,
      latitude: p.latitude as number | undefined,
      longitude: p.longitude as number | undefined,
      localId: item.entityId,
    };
  }

  private toUpdateExpenseDto(payload: Record<string, unknown>): UpdateExpenseDto {
    return {
      branchId: payload.branchId as string | undefined,
      categoryId: payload.categoryId as string | undefined,
      amount: payload.amount !== undefined ? Number(payload.amount) : undefined,
      transactionDate: payload.transactionDate as string | undefined,
      vendorName: payload.vendorName as string | undefined,
      description: payload.description as string | undefined,
      attachmentUrl: payload.attachmentUrl as string | undefined,
    };
  }
}
