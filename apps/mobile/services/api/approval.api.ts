import { api, unwrap } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { ApprovalFlow } from '@/types/approval.types';

export const approvalApi = {
  getAll: async (page = 1, limit = 20) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<ApprovalFlow>>>('/approvals', {
      params: { page, limit },
    });
    return unwrap(data);
  },

  getPending: async () => {
    const { data } = await api.get<ApiResponse<ApprovalFlow[]>>('/approvals/pending');
    return unwrap(data);
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<ApprovalFlow>>(`/approvals/${id}`);
    return unwrap(data);
  },

  approve: async (id: string, comment?: string) => {
    const { data } = await api.post<ApiResponse<ApprovalFlow>>(`/approvals/${id}/approve`, {
      comment,
    });
    return unwrap(data);
  },

  reject: async (id: string, comment?: string) => {
    const { data } = await api.post<ApiResponse<ApprovalFlow>>(`/approvals/${id}/reject`, {
      comment,
    });
    return unwrap(data);
  },

  submit: async (entityId: string) => {
    const { data } = await api.post<ApiResponse<ApprovalFlow>>('/approvals/submit', {
      entityType: 'EXPENSE',
      entityId,
    });
    return unwrap(data);
  },
};
