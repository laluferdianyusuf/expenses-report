import { useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setBiometricEnabled } from '@/store/slices/auth.slice';
import { showToast } from '@/store/slices/ui.slice';
import {
  getRefreshToken,
  saveBiometricEmail,
  clearBiometricEmail,
} from '@/services/storage/secure-storage';
import { authApi } from '@/services/api/auth.api';
import { setCredentials } from '@/store/slices/auth.slice';
import { setCurrentOrg } from '@/store/slices/organization.slice';
import { saveTokens } from '@/services/storage/secure-storage';

export function useBiometric() {
  const dispatch = useAppDispatch();
  const biometricEnabled = useAppSelector((s) => s.auth.biometricEnabled);

  const checkHardware = useCallback(async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }, []);

  const authenticate = useCallback(async (prompt = 'Autentikasi untuk melanjutkan') => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Batal',
      disableDeviceFallback: false,
    });
    return result.success;
  }, []);

  const enableBiometric = useCallback(
    async (email: string) => {
      const available = await checkHardware();
      if (!available) {
        dispatch(showToast({ type: 'error', message: 'Biometrik tidak tersedia di perangkat ini' }));
        return false;
      }
      const success = await authenticate('Aktifkan login biometrik');
      if (!success) return false;
      await saveBiometricEmail(email);
      dispatch(setBiometricEnabled(true));
      dispatch(showToast({ type: 'success', message: 'Login biometrik diaktifkan' }));
      return true;
    },
    [authenticate, checkHardware, dispatch],
  );

  const disableBiometric = useCallback(async () => {
    await clearBiometricEmail();
    dispatch(setBiometricEnabled(false));
  }, [dispatch]);

  const loginWithBiometric = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      dispatch(showToast({ type: 'error', message: 'Silakan login dengan email terlebih dahulu' }));
      return false;
    }
    const success = await authenticate('Login dengan biometrik');
    if (!success) return false;

    try {
      const tokens = await authApi.refresh(refreshToken);
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      const user = await authApi.getMe();
      if (!user.organization) {
        dispatch(showToast({ type: 'error', message: 'Data organisasi tidak ditemukan' }));
        return false;
      }
      dispatch(setCredentials({ user, organization: user.organization }));
      dispatch(setCurrentOrg(user.organization.id));
      return true;
    } catch {
      dispatch(showToast({ type: 'error', message: 'Sesi biometrik kedaluwarsa, login ulang' }));
      return false;
    }
  }, [authenticate, dispatch]);

  return {
    biometricEnabled,
    checkHardware,
    enableBiometric,
    disableBiometric,
    loginWithBiometric,
    authenticate,
  };
}
