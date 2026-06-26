import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { Category } from '@/types/transaction.types';

export const categoryApi = {
  listIncome: async () => {
    const { data } = await api.get<ApiResponse<Category[]>>('/income-categories');
    return unwrap(data);
  },

  listExpense: async () => {
    const { data } = await api.get<ApiResponse<Category[]>>('/expense-categories');
    return unwrap(data);
  },
};
