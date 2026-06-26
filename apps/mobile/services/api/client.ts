import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/services/storage/secure-storage';
import { store } from '@/store/store';
import { clearCredentials } from '@/store/slices/auth.slice';
import type { ApiResponse } from '@/types/api.types';
import type { AuthTokens } from '@/types/auth.types';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  const orgId = store.getState().organization.currentOrgId;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (orgId) {
    config.headers['X-Organization-Id'] = orgId;
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokenFlow(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await axios.post<ApiResponse<AuthTokens>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    await saveTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    store.dispatch(clearCredentials());
    return false;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshTokenFlow().finally(() => {
        refreshPromise = null;
      });
      const refreshed = await refreshPromise;
      if (refreshed) return api(original);
    }

    return Promise.reject(error);
  },
);

export function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message[0];
    if (typeof data?.message === 'string') return data.message;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan';
}
