import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { DeviceInfo, DeviceType } from '@/types/auth.types';
import { getDevicePushToken } from '@/services/notification/push.service';

function getDeviceType(): DeviceType {
  if (Platform.OS === 'ios') {
    return Device.deviceType === Device.DeviceType.TABLET ? 'TABLET' : 'IOS';
  }
  if (Platform.OS === 'android') {
    return Device.deviceType === Device.DeviceType.TABLET ? 'TABLET' : 'ANDROID';
  }
  return 'WEB';
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  let deviceId = 'unknown-device';

  if (Platform.OS === 'android' && Application.getAndroidId()) {
    deviceId = Application.getAndroidId()!;
  } else if (Platform.OS === 'ios') {
    deviceId = (await Application.getIosIdForVendorAsync()) ?? 'ios-unknown';
  } else {
    deviceId = `${Platform.OS}-${Date.now()}`;
  }

  return {
    deviceId,
    deviceName: Device.modelName ?? Device.deviceName ?? undefined,
    deviceType: getDeviceType(),
    fcmToken: (await getDevicePushToken()) ?? undefined,
  };
}
