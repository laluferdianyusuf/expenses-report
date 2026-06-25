import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { AnalyticsPeriod, AnalyticsQueryDto } from './dto/analytics.dto';

interface DateRange {
  start: Date;
  end: Date;
  period: AnalyticsPeriod;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    const branchFilter = query.branchId ? { branchId: query.branchId } : {};

    const [income, expense, prevIncome, prevExpense] = await Promise.all([
      this.sumIncome(ctx.organizationId, range.start, range.end, query.branchId),
      this.sumExpense(ctx.organizationId, range.start, range.end, query.branchId),
      this.sumIncome(ctx.organizationId, ...this.previousRange(range)),
      this.sumExpense(ctx.organizationId, ...this.previousRange(range)),
    ]);

    const profit = income - expense;
    const prevProfit = prevIncome - prevExpense;

    const kas = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId: ctx.organizationId, code: '1000' },
    });

    return {
      period: range.period,
      startDate: range.start,
      endDate: range.end,
      totalIncome: income,
      totalExpense: expense,
      profit,
      currentBalance: Number(kas?.balance ?? 0),
      growth: {
        income: this.growthPercent(income, prevIncome),
        expense: this.growthPercent(expense, prevExpense),
        profit: this.growthPercent(profit, prevProfit),
      },
    };
  }

  async getIncomeTrend(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    return this.getIncomeTrendData(ctx.organizationId, range, query.branchId);
  }

  async getExpenseTrend(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    return this.getExpenseTrendData(ctx.organizationId, range, query.branchId);
  }

  async getCashflowTrend(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    const [incomeTrend, expenseTrend] = await Promise.all([
      this.getIncomeTrendData(ctx.organizationId, range, query.branchId),
      this.getExpenseTrendData(ctx.organizationId, range, query.branchId),
    ]);

    return incomeTrend.map((point, i) => ({
      date: point.date,
      income: point.amount,
      expense: expenseTrend[i]?.amount ?? 0,
      net: point.amount - (expenseTrend[i]?.amount ?? 0),
    }));
  }

  async getTopCategories(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    const branchFilter = query.branchId ? { branchId: query.branchId } : {};

    const [incomeByCategory, expenseByCategory] = await Promise.all([
      this.prisma.income.groupBy({
        by: ['categoryId'],
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          transactionDate: { gte: range.start, lte: range.end },
          ...branchFilter,
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          status: 'APPROVED',
          transactionDate: { gte: range.start, lte: range.end },
          ...branchFilter,
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

    const incomeCategories = await this.prisma.incomeCategory.findMany({
      where: { id: { in: incomeByCategory.map((i) => i.categoryId) } },
    });
    const expenseCategories = await this.prisma.expenseCategory.findMany({
      where: { id: { in: expenseByCategory.map((e) => e.categoryId) } },
    });

    const incomeCatMap = Object.fromEntries(incomeCategories.map((c) => [c.id, c]));
    const expenseCatMap = Object.fromEntries(expenseCategories.map((c) => [c.id, c]));

    return {
      income: incomeByCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: incomeCatMap[item.categoryId]?.name ?? 'Unknown',
        amount: Number(item._sum.amount ?? 0),
      })),
      expense: expenseByCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: expenseCatMap[item.categoryId]?.name ?? 'Unknown',
        amount: Number(item._sum.amount ?? 0),
      })),
    };
  }

  async getMonthlyComparison(ctx: TenantContext, branchId?: string) {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      months.push({
        label: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        start,
        end,
      });
    }

    const data = await Promise.all(
      months.map(async (m) => {
        const [income, expense] = await Promise.all([
          this.sumIncome(ctx.organizationId, m.start, m.end, branchId),
          this.sumExpense(ctx.organizationId, m.start, m.end, branchId),
        ]);
        return {
          label: m.label,
          income,
          expense,
          profit: income - expense,
        };
      }),
    );

    return data;
  }

  async getGrowthRate(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    const [prevStart, prevEnd] = this.previousRange(range);

    const [income, expense, prevIncome, prevExpense] = await Promise.all([
      this.sumIncome(ctx.organizationId, range.start, range.end, query.branchId),
      this.sumExpense(ctx.organizationId, range.start, range.end, query.branchId),
      this.sumIncome(ctx.organizationId, prevStart, prevEnd, query.branchId),
      this.sumExpense(ctx.organizationId, prevStart, prevEnd, query.branchId),
    ]);

    return {
      incomeGrowthRate: this.growthPercent(income, prevIncome),
      expenseGrowthRate: this.growthPercent(expense, prevExpense),
      profitGrowthRate: this.growthPercent(income - expense, prevIncome - prevExpense),
    };
  }

  async getHealthScore(ctx: TenantContext, query: AnalyticsQueryDto) {
    const range = this.resolveRange(query);
    const branchFilter = query.branchId ? { branchId: query.branchId } : {};

    const [income, expense, budgetAlerts, targets, transactionDays] =
      await Promise.all([
        this.sumIncome(ctx.organizationId, range.start, range.end, query.branchId),
        this.sumExpense(ctx.organizationId, range.start, range.end, query.branchId),
        this.prisma.budget.count({
          where: {
            organizationId: ctx.organizationId,
            isActive: true,
            alertLevel: { in: ['WARNING_80', 'WARNING_90', 'OVER_BUDGET'] },
          },
        }),
        this.prisma.target.findMany({
          where: { organizationId: ctx.organizationId, status: 'IN_PROGRESS' },
        }),
        this.countActiveDays(ctx.organizationId, range.start, range.end, branchFilter),
      ]);

    let score = 50;

    if (income > 0) {
      const expenseRatio = expense / income;
      if (expenseRatio <= 0.7) score += 25;
      else if (expenseRatio <= 0.9) score += 15;
      else score -= 10;
    }

    const totalDays = Math.max(
      1,
      Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000),
    );
    const consistencyScore = (transactionDays / totalDays) * 25;
    score += consistencyScore;

    score -= budgetAlerts * 5;

    if (targets.length > 0) {
      const avgProgress =
        targets.reduce((sum, t) => {
          const target = Number(t.targetAmount);
          const current = Number(t.currentAmount);
          return sum + (target > 0 ? (current / target) * 100 : 0);
        }, 0) / targets.length;
      score += Math.min(15, avgProgress / 100 * 15);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      rating: this.healthRating(score),
      factors: {
        expenseRatio: income > 0 ? expense / income : null,
        budgetAlerts,
        activeTransactionDays: transactionDays,
        targetCount: targets.length,
      },
    };
  }

  private async getIncomeTrendData(
    organizationId: string,
    range: DateRange,
    branchId?: string,
  ) {
    const branchFilter = branchId ? { branchId } : {};
    const records = await this.prisma.income.findMany({
      where: {
        organizationId,
        deletedAt: null,
        transactionDate: { gte: range.start, lte: range.end },
        ...branchFilter,
      },
      select: { transactionDate: true, amount: true },
      orderBy: { transactionDate: 'asc' },
    });
    return this.aggregateToBuckets(records, range);
  }

  private async getExpenseTrendData(
    organizationId: string,
    range: DateRange,
    branchId?: string,
  ) {
    const branchFilter = branchId ? { branchId } : {};
    const records = await this.prisma.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'APPROVED',
        transactionDate: { gte: range.start, lte: range.end },
        ...branchFilter,
      },
      select: { transactionDate: true, amount: true },
      orderBy: { transactionDate: 'asc' },
    });
    return this.aggregateToBuckets(records, range);
  }

  private aggregateToBuckets(
    records: { transactionDate: Date; amount: import('@prisma/client/runtime/library').Decimal }[],
    range: DateRange,
  ) {
    const buckets = this.buildBuckets(range);
    for (const record of records) {
      const key = this.bucketKey(record.transactionDate, range.period);
      if (buckets[key] !== undefined) {
        buckets[key] += Number(record.amount);
      }
    }
    return Object.entries(buckets).map(([date, amount]) => ({ date, amount }));
  }

  private buildBuckets(range: DateRange): Record<string, number> {
    const buckets: Record<string, number> = {};
    const cursor = new Date(range.start);

    while (cursor <= range.end) {
      buckets[this.bucketKey(cursor, range.period)] = 0;
      if (range.period === AnalyticsPeriod.DAILY) {
        cursor.setDate(cursor.getDate() + 1);
      } else if (range.period === AnalyticsPeriod.WEEKLY) {
        cursor.setDate(cursor.getDate() + 7);
      } else {
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return buckets;
  }

  private bucketKey(date: Date, period: AnalyticsPeriod): string {
    if (period === AnalyticsPeriod.DAILY) {
      return date.toISOString().slice(0, 10);
    }
    if (period === AnalyticsPeriod.WEEKLY) {
      const d = new Date(date);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d.toISOString().slice(0, 10);
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private resolveRange(query: AnalyticsQueryDto): DateRange {
    const now = new Date();
    const period = query.period ?? AnalyticsPeriod.MONTHLY;

    if (query.startDate && query.endDate) {
      return {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
        period: AnalyticsPeriod.CUSTOM,
      };
    }

    let start: Date;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (period) {
      case AnalyticsPeriod.DAILY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case AnalyticsPeriod.WEEKLY:
        start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case AnalyticsPeriod.YEARLY:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case AnalyticsPeriod.MONTHLY:
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return { start, end, period };
  }

  private previousRange(range: DateRange): [Date, Date] {
    const duration = range.end.getTime() - range.start.getTime();
    const prevEnd = new Date(range.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return [prevStart, prevEnd];
  }

  private async sumIncome(
    organizationId: string,
    start: Date,
    end: Date,
    branchId?: string,
  ) {
    const result = await this.prisma.income.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        transactionDate: { gte: start, lte: end },
        ...(branchId && { branchId }),
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private async sumExpense(
    organizationId: string,
    start: Date,
    end: Date,
    branchId?: string,
  ) {
    const result = await this.prisma.expense.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: 'APPROVED',
        transactionDate: { gte: start, lte: end },
        ...(branchId && { branchId }),
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private async countActiveDays(
    organizationId: string,
    start: Date,
    end: Date,
    branchFilter: { branchId?: string },
  ) {
    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({
        where: {
          organizationId,
          deletedAt: null,
          transactionDate: { gte: start, lte: end },
          ...branchFilter,
        },
        select: { transactionDate: true },
      }),
      this.prisma.expense.findMany({
        where: {
          organizationId,
          deletedAt: null,
          transactionDate: { gte: start, lte: end },
          ...branchFilter,
        },
        select: { transactionDate: true },
      }),
    ]);

    const days = new Set<string>();
    for (const r of [...incomes, ...expenses]) {
      days.add(r.transactionDate.toISOString().slice(0, 10));
    }
    return days.size;
  }

  private growthPercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  private healthRating(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  }
}
