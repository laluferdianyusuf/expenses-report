export type SyncStatus = 'SYNCED' | 'PENDING' | 'FAILED';
export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Category {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
}

export interface Income {
  id: string;
  organizationId: string;
  branchId?: string | null;
  categoryId: string;
  amount: number | string;
  transactionDate: string;
  sourceName?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
  localId?: string | null;
  category?: Category;
  branch?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
  syncStatus?: SyncStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  branchId?: string | null;
  categoryId: string;
  amount: number | string;
  transactionDate: string;
  vendorName?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
  status: ExpenseStatus;
  localId?: string | null;
  category?: Category;
  branch?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
  syncStatus?: SyncStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIncomeInput {
  categoryId: string;
  amount: number;
  transactionDate: string;
  sourceName?: string;
  description?: string;
  branchId?: string;
  localId?: string;
}

export interface UpdateIncomeInput {
  categoryId?: string;
  amount?: number;
  transactionDate?: string;
  sourceName?: string;
  description?: string;
  branchId?: string;
}

export interface CreateExpenseInput {
  categoryId: string;
  amount: number;
  transactionDate: string;
  vendorName?: string;
  description?: string;
  branchId?: string;
  localId?: string;
}

export interface UpdateExpenseInput {
  categoryId?: string;
  amount?: number;
  transactionDate?: string;
  vendorName?: string;
  description?: string;
  branchId?: string;
}

export interface IncomeFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExpenseFilters extends IncomeFilters {
  status?: ExpenseStatus;
}
