import { api, unwrap } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseFilters,
  UpdateExpenseInput,
} from '@/types/transaction.types';

export const expenseApi = {
  getAll: async (filters: ExpenseFilters = {}) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Expense>>>('/expenses', {
      params: filters,
    });
    return unwrap(data);
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return unwrap(data);
  },

  create: async (input: CreateExpenseInput) => {
    const { data } = await api.post<ApiResponse<Expense>>('/expenses', input);
    return unwrap(data);
  },

  update: async (id: string, input: UpdateExpenseInput) => {
    const { data } = await api.patch<ApiResponse<Expense>>(`/expenses/${id}`, input);
    return unwrap(data);
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/expenses/${id}`);
    return unwrap(data);
  },
};
