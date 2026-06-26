import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Organization, User } from '@/types/auth.types';

function extractPermissions(user: User | null): string[] {
  if (!user?.role?.rolePermissions) return [];
  return user.role.rolePermissions.map((rp) => rp.permission.slug);
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  permissions: string[];
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  permissions: [],
  isAuthenticated: false,
  biometricEnabled: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; organization: Organization }>,
    ) => {
      state.user = action.payload.user;
      state.organization = action.payload.organization;
      state.permissions = extractPermissions(action.payload.user);
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.organization = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  setCredentials,
  clearCredentials,
  setBiometricEnabled,
  setAuthLoading,
  updateProfile,
} = authSlice.actions;

export default authSlice.reducer;
