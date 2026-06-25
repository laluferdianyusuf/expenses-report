import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(ctx: TenantContext, branchId?: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const branchFilter = branchId ? { branchId } : {};

    const [
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
      pendingApprovals,
      budgetAlerts,
      unreadNotifications,
      recentIncomes,
      recentExpenses,
      kasAccount,
    ] = await Promise.all([
      this.prisma.income.aggregate({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          transactionDate: { gte: todayStart },
          ...branchFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          status: 'APPROVED',
          transactionDate: { gte: todayStart },
          ...branchFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.income.aggregate({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          transactionDate: { gte: monthStart, lte: monthEnd },
          ...branchFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          status: 'APPROVED',
          transactionDate: { gte: monthStart, lte: monthEnd },
          ...branchFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.approvalFlow.count({
        where: { organizationId: ctx.organizationId, status: 'PENDING' },
      }),
      this.prisma.budget.count({
        where: {
          organizationId: ctx.organizationId,
          isActive: true,
          alertLevel: { in: ['WARNING_80', 'WARNING_90', 'OVER_BUDGET'] },
        },
      }),
      this.prisma.notification.count({
        where: { userId: ctx.userId, status: 'UNREAD' },
      }),
      this.prisma.income.findMany({
        where: { organizationId: ctx.organizationId, deletedAt: null, ...branchFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.expense.findMany({
        where: { organizationId: ctx.organizationId, deletedAt: null, ...branchFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.chartOfAccount.findFirst({
        where: { organizationId: ctx.organizationId, code: '1000' },
      }),
    ]);

    const todayIncomeVal = Number(todayIncome._sum.amount ?? 0);
    const todayExpenseVal = Number(todayExpense._sum.amount ?? 0);
    const monthIncomeVal = Number(monthIncome._sum.amount ?? 0);
    const monthExpenseVal = Number(monthExpense._sum.amount ?? 0);

    const recentTransactions = [
      ...recentIncomes.map((i) => ({
        id: i.id,
        type: 'INCOME' as const,
        amount: i.amount,
        category: i.category.name,
        date: i.transactionDate,
        description: i.sourceName ?? i.description,
      })),
      ...recentExpenses.map((e) => ({
        id: e.id,
        type: 'EXPENSE' as const,
        amount: e.amount,
        category: e.category.name,
        date: e.transactionDate,
        description: e.vendorName ?? e.description,
        status: e.status,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      today: {
        income: todayIncomeVal,
        expense: todayExpenseVal,
        profit: todayIncomeVal - todayExpenseVal,
      },
      thisMonth: {
        income: monthIncomeVal,
        expense: monthExpenseVal,
        profit: monthIncomeVal - monthExpenseVal,
      },
      currentBalance: Number(kasAccount?.balance ?? 0),
      pendingApprovals,
      budgetAlerts,
      unreadNotifications,
      recentTransactions,
      healthScore: this.calculateHealthScore(monthIncomeVal, monthExpenseVal, budgetAlerts),
    };
  }

  private calculateHealthScore(
    monthIncome: number,
    monthExpense: number,
    budgetAlerts: number,
  ): number {
    let score = 70;
    if (monthIncome > 0) {
      const ratio = monthExpense / monthIncome;
      if (ratio <= 0.7) score += 20;
      else if (ratio <= 0.9) score += 10;
      else score -= 10;
    }
    score -= budgetAlerts * 5;
    return Math.max(0, Math.min(100, score));
  }
}
