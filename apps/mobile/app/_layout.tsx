import { useEffect } from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { persistor, store } from '@/store/store';
import { queryClient } from '@/queries/query-client';
import { NetworkProvider } from '@/providers/NetworkProvider';
import { SyncProvider } from '@/providers/SyncProvider';
import { PushNotificationProvider } from '@/providers/PushNotificationProvider';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { setAuthLoading } from '@/store/slices/auth.slice';
import { OfflineBanner } from '@/components/sync/OfflineBanner';
import { useTheme } from '@/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

function NavigationGuard({ children }: { children: React.ReactNode }) {
  useProtectedRoute();
  return <>{children}</>;
}

function RootStack() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    store.dispatch(setAuthLoading(false));
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <NetworkProvider>
              <SyncProvider>
                <PushNotificationProvider>
                  <NavigationGuard>
                    <RootStack />
                  </NavigationGuard>
                </PushNotificationProvider>
              </SyncProvider>
            </NetworkProvider>
          </QueryClientProvider>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
