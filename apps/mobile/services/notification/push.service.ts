import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsApi } from '@/services/api/notifications.api';
import type { NotificationTapPayload } from '@/types/notification.types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getDevicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FMS Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getDevicePushTokenAsync();

    return tokenData.data;
  } catch {
    try {
      const native = await Notifications.getDevicePushTokenAsync();
      return native.data;
    } catch {
      return null;
    }
  }
}

export async function registerPushTokenWithBackend(
  deviceId: string,
  token: string,
): Promise<void> {
  await notificationsApi.registerDevice(deviceId, token);
}

export function parseNotificationData(
  data: Record<string, unknown> | undefined,
): NotificationTapPayload {
  if (!data) return {};
  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    entityId: typeof data.entityId === 'string' ? data.entityId : undefined,
    entityType: typeof data.entityType === 'string' ? data.entityType : undefined,
  };
}

export type NotificationSubscription = Notifications.Subscription;

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function getInitialNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}

export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
