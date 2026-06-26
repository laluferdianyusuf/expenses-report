import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const BIOMETRIC_EMAIL_KEY = 'biometricEmail';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveBiometricEmail(email: string) {
  await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
}

export async function getBiometricEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
}

export async function clearBiometricEmail() {
  await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
}
