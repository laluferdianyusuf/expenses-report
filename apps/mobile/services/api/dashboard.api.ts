import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardStats } from '@/types/dashboard.types';

export const dashboardApi = {
  getDashboard: async (branchId?: string) => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard', {
      params: branchId ? { branchId } : undefined,
    });
    return unwrap(data);
  },
};
