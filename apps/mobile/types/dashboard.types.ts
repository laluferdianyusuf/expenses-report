export interface DashboardStats {
  today: {
    income: number;
    expense: number;
    profit: number;
  };
  thisMonth: {
    income: number;
    expense: number;
    profit: number;
  };
  currentBalance: number;
  pendingApprovals: number;
  budgetAlerts: number;
  unreadNotifications: number;
  recentTransactions: RecentTransaction[];
  healthScore: number;
}

export interface RecentTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number | string;
  category: string;
  date: string;
  description?: string | null;
  status?: string;
}
