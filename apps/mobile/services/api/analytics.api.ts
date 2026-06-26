import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AnalyticsOverview,
  AnalyticsQuery,
  HealthScoreResult,
  TrendPoint,
} from '@/types/analytics.types';

export const analyticsApi = {
  getOverview: async (query: AnalyticsQuery = {}) => {
    const { data } = await api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview', {
      params: query,
    });
    return unwrap(data);
  },

  getIncomeTrend: async (query: AnalyticsQuery = {}) => {
    const { data } = await api.get<ApiResponse<TrendPoint[]>>('/analytics/income-trend', {
      params: query,
    });
    return unwrap(data);
  },

  getExpenseTrend: async (query: AnalyticsQuery = {}) => {
    const { data } = await api.get<ApiResponse<TrendPoint[]>>('/analytics/expense-trend', {
      params: query,
    });
    return unwrap(data);
  },

  getCashflowTrend: async (query: AnalyticsQuery = {}) => {
    const { data } = await api.get<ApiResponse<TrendPoint[]>>('/analytics/cashflow-trend', {
      params: query,
    });
    return unwrap(data);
  },

  getHealthScore: async (query: AnalyticsQuery = {}) => {
    const { data } = await api.get<ApiResponse<HealthScoreResult>>('/analytics/health-score', {
      params: query,
    });
    return unwrap(data);
  },
};
