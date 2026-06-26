import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/store/hooks';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getDevicePushToken,
  getInitialNotificationResponse,
  parseNotificationData,
  registerPushTokenWithBackend,
  requestNotificationPermissions,
  setBadgeCount,
} from '@/services/notification/push.service';
import { getDeviceInfo } from '@/utils/device';
import { queryKeys } from '@/queries/keys';
import { notificationsApi } from '@/services/api/notifications.api';

function navigateFromNotification(payload: ReturnType<typeof parseNotificationData>) {
  if (payload.type === 'APPROVAL_PENDING' || payload.entityType === 'EXPENSE') {
    if (payload.entityId) {
      router.push(`/(tabs)/more/approvals/${payload.entityId}`);
      return;
    }
    router.push('/(tabs)/more/approvals');
    return;
  }
  if (payload.type === 'BUDGET_ALERT') {
    router.push('/(tabs)/more/budget');
    return;
  }
  router.push('/(tabs)/more/notifications');
}

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let mounted = true;

    (async () => {
      await requestNotificationPermissions();
      const token = await getDevicePushToken();
      if (!token || !mounted || registeredRef.current) return;

      const deviceInfo = await getDeviceInfo();
      try {
        await registerPushTokenWithBackend(deviceInfo.deviceId, token);
        registeredRef.current = true;
      } catch {
        // Will retry on next app open
      }

      try {
        const { count } = await notificationsApi.getUnreadCount();
        await setBadgeCount(count);
      } catch {
        // non-blocking
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all(userId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    };

    const receivedSub = addNotificationReceivedListener(() => invalidate());

    const responseSub = addNotificationResponseListener((response) => {
      invalidate();
      const payload = parseNotificationData(
        response.notification.request.content.data as Record<string, unknown>,
      );
      navigateFromNotification(payload);
    });

    getInitialNotificationResponse().then((response) => {
      if (!response) return;
      const payload = parseNotificationData(
        response.notification.request.content.data as Record<string, unknown>,
      );
      navigateFromNotification(payload);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated, userId, queryClient]);

  return <>{children}</>;
}
