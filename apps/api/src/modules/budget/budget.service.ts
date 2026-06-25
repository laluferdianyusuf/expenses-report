import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
import { BudgetAlertLevel, Expense } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BudgetService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  findAll(ctx: TenantContext) {
    return this.prisma.budget.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      include: { category: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(ctx: TenantContext, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { category: true, histories: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  create(ctx: TenantContext, dto: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        organizationId: ctx.organizationId,
        categoryId: dto.categoryId,
        budgetAmount: dto.budgetAmount,
        usedAmount: 0,
        remainingAmount: dto.budgetAmount,
        period: dto.period,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: { category: true },
    });
  }

  async update(ctx: TenantContext, id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(ctx, id);
    const newAmount = dto.budgetAmount ?? Number(budget.budgetAmount);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.budget.update({
        where: { id },
        data: {
          ...(dto.budgetAmount && {
            budgetAmount: dto.budgetAmount,
            remainingAmount: newAmount - Number(budget.usedAmount),
          }),
          ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        },
        include: { category: true },
      });

      if (dto.budgetAmount) {
        await tx.budgetHistory.create({
          data: {
            budgetId: id,
            organizationId: ctx.organizationId,
            previousAmount: budget.budgetAmount,
            newAmount: dto.budgetAmount,
            previousUsed: budget.usedAmount,
            newUsed: budget.usedAmount,
            changeReason: dto.changeReason,
            changedBy: ctx.userId,
          },
        });
      }

      return result;
    });

    return updated;
  }

  async remove(ctx: TenantContext, id: string) {
    await this.findOne(ctx, id);
    return this.prisma.budget.update({
      where: { id },
      data: { isActive: false },
    });
  }

  monitoring(ctx: TenantContext) {
    return this.prisma.budget.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      include: { category: true },
      orderBy: { alertLevel: 'desc' },
    });
  }

  async recalculateForExpense(organizationId: string, expense: Expense) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        organizationId,
        categoryId: expense.categoryId,
        isActive: true,
        startDate: { lte: expense.transactionDate },
        endDate: { gte: expense.transactionDate },
      },
    });

    for (const budget of budgets) {
      const used = Number(budget.usedAmount) + Number(expense.amount);
      const total = Number(budget.budgetAmount);
      const remaining = total - used;
      const pct = total > 0 ? (used / total) * 100 : 0;

      let alertLevel: BudgetAlertLevel = 'NORMAL';
      if (pct > 100) alertLevel = 'OVER_BUDGET';
      else if (pct >= 90) alertLevel = 'WARNING_90';
      else if (pct >= 80) alertLevel = 'WARNING_80';

      const updated = await this.prisma.budget.update({
        where: { id: budget.id },
        data: { usedAmount: used, remainingAmount: remaining, alertLevel },
      });

      if (alertLevel !== 'NORMAL' && alertLevel !== budget.alertLevel) {
        await this.notificationsService.notifyBudgetAlert(organizationId, updated);
      }
    }
  }
}
