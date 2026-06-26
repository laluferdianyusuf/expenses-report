export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (orgId: string, branchId?: string) =>
      ['dashboard', 'stats', orgId, branchId] as const,
  },
  incomes: {
    all: (orgId: string) => ['incomes', orgId] as const,
    list: (orgId: string, filters: object) =>
      ['incomes', orgId, 'list', filters] as const,
    detail: (id: string) => ['incomes', 'detail', id] as const,
  },
  expenses: {
    all: (orgId: string) => ['expenses', orgId] as const,
    list: (orgId: string, filters: object) =>
      ['expenses', orgId, 'list', filters] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
  },
  categories: {
    income: (orgId: string) => ['categories', 'income', orgId] as const,
    expense: (orgId: string) => ['categories', 'expense', orgId] as const,
  },
  budgets: {
    all: (orgId: string) => ['budgets', orgId] as const,
    monitoring: (orgId: string) => ['budgets', orgId, 'monitoring'] as const,
    detail: (id: string) => ['budgets', 'detail', id] as const,
  },
  analytics: {
    overview: (orgId: string, query: object) =>
      ['analytics', orgId, 'overview', query] as const,
    healthScore: (orgId: string) => ['analytics', orgId, 'health-score'] as const,
    incomeTrend: (orgId: string) => ['analytics', orgId, 'income-trend'] as const,
    expenseTrend: (orgId: string) => ['analytics', orgId, 'expense-trend'] as const,
  },
  approvals: {
    all: (orgId: string) => ['approvals', orgId] as const,
    pending: (orgId: string) => ['approvals', orgId, 'pending'] as const,
    detail: (id: string) => ['approvals', 'detail', id] as const,
  },
  notifications: {
    all: (userId: string) => ['notifications', userId] as const,
    unread: (userId: string) => ['notifications', userId, 'unread'] as const,
  },
};
