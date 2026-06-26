import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type { SyncEntityType, SyncPullResult, SyncPushResult } from '@/types/sync.types';

export const syncApi = {
  push: async (body: {
    deviceId: string;
    items: Array<{
      entityType: SyncEntityType;
      entityId: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      payload: Record<string, unknown>;
      clientTimestamp: string;
    }>;
  }) => {
    const { data } = await api.post<ApiResponse<SyncPushResult>>('/sync/push', body);
    return unwrap(data);
  },

  pull: async (since: string, entities?: string) => {
    const { data } = await api.get<ApiResponse<SyncPullResult>>('/sync/pull', {
      params: { since, entities },
    });
    return unwrap(data);
  },

  getStatus: async (deviceId: string) => {
    const { data } = await api.get<ApiResponse<unknown>>('/sync/status', {
      params: { deviceId },
    });
    return unwrap(data);
  },
};
