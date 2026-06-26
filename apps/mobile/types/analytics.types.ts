export type AnalyticsPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface AnalyticsOverview {
  period: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  profit: number;
  currentBalance: number;
  incomeGrowth?: number;
  expenseGrowth?: number;
}

export interface TrendPoint {
  label: string;
  date: string;
  amount: number;
}

export interface HealthScoreResult {
  score: number;
  rating: string;
  breakdown: Record<string, number>;
}

export interface AnalyticsQuery {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}
