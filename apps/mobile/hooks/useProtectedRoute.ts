import { useEffect } from 'react';
import { useSegments, useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const segmentList = segments as string[];
    const isBiometricSetup = segmentList[1] === 'biometric-setup';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !isBiometricSetup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments, router]);
}
