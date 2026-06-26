import { api, unwrap } from './client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AuthResponse,
  AuthTokens,
  LoginInput,
  RegisterInput,
  User,
} from '@/types/auth.types';

export const authApi = {
  login: async (input: LoginInput) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', input);
    return unwrap(data);
  },

  register: async (input: RegisterInput) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', input);
    return unwrap(data);
  },

  getMe: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return unwrap(data);
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    return unwrap(data);
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', {
      email,
    });
    return unwrap(data);
  },

  logout: async () => {
    await api.post('/auth/logout');
  },
};
