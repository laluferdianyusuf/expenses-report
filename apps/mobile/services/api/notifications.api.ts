import { api, unwrap } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { AppNotification } from '@/types/notification.types';

export const notificationsApi = {
  getAll: async (page = 1, limit = 20) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AppNotification>>>(
      '/notifications',
      { params: { page, limit } },
    );
    return unwrap(data);
  },

  getUnreadCount: async () => {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return unwrap(data);
  },

  registerDevice: async (deviceId: string, fcmToken: string) => {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      '/notifications/register-device',
      { deviceId, fcmToken },
    );
    return unwrap(data);
  },

  markRead: async (id: string) => {
    const { data } = await api.patch<ApiResponse<{ count: number }>>(`/notifications/${id}/read`);
    return unwrap(data);
  },

  markAllRead: async () => {
    const { data } = await api.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return unwrap(data);
  },

  archive: async (id: string) => {
    const { data } = await api.patch<ApiResponse<{ count: number }>>(`/notifications/${id}/archive`);
    return unwrap(data);
  },
};
