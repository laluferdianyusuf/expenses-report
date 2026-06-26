export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
export type BudgetAlertLevel = 'NORMAL' | 'WARNING_80' | 'WARNING_90' | 'OVER_BUDGET';

export interface Budget {
  id: string;
  organizationId: string;
  categoryId: string;
  budgetAmount: number | string;
  usedAmount: number | string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  alertLevel: BudgetAlertLevel;
  isActive: boolean;
  category?: { id: string; name: string };
}

export interface CreateBudgetInput {
  categoryId: string;
  budgetAmount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}
