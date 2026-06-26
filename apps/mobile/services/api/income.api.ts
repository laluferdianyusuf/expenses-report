import { api, unwrap } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  CreateIncomeInput,
  Income,
  IncomeFilters,
  UpdateIncomeInput,
} from '@/types/transaction.types';

export const incomeApi = {
  getAll: async (filters: IncomeFilters = {}) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Income>>>('/incomes', {
      params: filters,
    });
    return unwrap(data);
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Income>>(`/incomes/${id}`);
    return unwrap(data);
  },

  create: async (input: CreateIncomeInput) => {
    const { data } = await api.post<ApiResponse<Income>>('/incomes', input);
    return unwrap(data);
  },

  update: async (id: string, input: UpdateIncomeInput) => {
    const { data } = await api.patch<ApiResponse<Income>>(`/incomes/${id}`, input);
    return unwrap(data);
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/incomes/${id}`);
    return unwrap(data);
  },
};
