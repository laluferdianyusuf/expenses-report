export type DeviceType = 'IOS' | 'ANDROID' | 'TABLET' | 'WEB';

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: DeviceType;
  fcmToken?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  organizationId: string;
  roleId: string;
  organization?: Organization;
  role?: {
    id: string;
    name: string;
    slug: string;
    rolePermissions?: Array<{
      permission: { slug: string; name: string };
    }>;
  };
}

export interface Organization {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  tokens: AuthTokens;
}

export interface LoginInput {
  email: string;
  password: string;
  organizationId?: string;
  deviceInfo: DeviceInfo;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  organizationName: string;
  deviceInfo: DeviceInfo;
}
