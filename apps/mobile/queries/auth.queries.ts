import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/auth.api';
import { getErrorMessage } from '@/services/api/client';
import { clearTokens, saveTokens } from '@/services/storage/secure-storage';
import { useAppDispatch } from '@/store/hooks';
import { clearCredentials, setCredentials } from '@/store/slices/auth.slice';
import { resetOrganization, setCurrentOrg } from '@/store/slices/organization.slice';
import { showToast } from '@/store/slices/ui.slice';
import type { LoginInput, RegisterInput } from '@/types/auth.types';
import { getDeviceInfo } from '@/utils/device';
import { setBadgeCount } from '@/services/notification/push.service';
import { queryKeys } from './keys';

async function handleAuthSuccess(
  dispatch: ReturnType<typeof useAppDispatch>,
  data: Awaited<ReturnType<typeof authApi.login>>,
) {
  await saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
  dispatch(setCredentials({ user: data.user, organization: data.organization }));
  dispatch(setCurrentOrg(data.organization.id));
}

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (input: Omit<LoginInput, 'deviceInfo'>) => {
      const deviceInfo = await getDeviceInfo();
      return authApi.login({ ...input, deviceInfo });
    },
    onSuccess: async (data) => {
      await handleAuthSuccess(dispatch, data);
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useRegister() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (input: Omit<RegisterInput, 'deviceInfo'>) => {
      const deviceInfo = await getDeviceInfo();
      return authApi.register({ ...input, deviceInfo });
    },
    onSuccess: async (data) => {
      await handleAuthSuccess(dispatch, data);
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } finally {
        await clearTokens();
      }
    },
    onSettled: async () => {
      dispatch(clearCredentials());
      dispatch(resetOrganization());
      await setBadgeCount(0);
      queryClient.clear();
    },
  });
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getMe,
    retry: false,
    enabled,
  });
}

export function useForgotPassword() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      dispatch(
        showToast({
          type: 'success',
          message: 'Link reset password telah dikirim ke email Anda',
        }),
      );
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}
