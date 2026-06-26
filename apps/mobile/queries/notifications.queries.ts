import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api/notifications.api';
import { setBadgeCount } from '@/services/notification/push.service';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showToast } from '@/store/slices/ui.slice';
import { getErrorMessage } from '@/services/api/client';
import { queryKeys } from './keys';

export function useNotifications(page = 1) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return useQuery({
    queryKey: [...queryKeys.notifications.all(userId!), page],
    queryFn: () => notificationsApi.getAll(page),
    enabled: !!userId,
  });
}

export function useUnreadNotificationCount() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return useQuery({
    queryKey: queryKeys.notifications.unread(userId!),
    queryFn: async () => {
      const result = await notificationsApi.getUnreadCount();
      await setBadgeCount(result.count);
      return result.count;
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((s) => s.auth.user?.id);

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(userId!) });
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userId = useAppSelector((s) => s.auth.user?.id);

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await setBadgeCount(0);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread(userId!) });
      dispatch(showToast({ type: 'success', message: 'Semua notifikasi ditandai dibaca' }));
    },
  });
}
