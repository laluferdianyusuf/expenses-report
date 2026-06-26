import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Budget, CreateBudgetInput } from '@/types/budget.types';

export const budgetApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Budget[]>>('/budgets');
    return unwrap(data);
  },

  getMonitoring: async () => {
    const { data } = await api.get<ApiResponse<Budget[]>>('/budgets/monitoring');
    return unwrap(data);
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Budget>>(`/budgets/${id}`);
    return unwrap(data);
  },

  create: async (input: CreateBudgetInput) => {
    const { data } = await api.post<ApiResponse<Budget>>('/budgets', input);
    return unwrap(data);
  },
};
