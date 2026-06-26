import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function MoreLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="budget/index" options={{ title: 'Anggaran' }} />
      <Stack.Screen name="budget/create" options={{ title: 'Buat Anggaran' }} />
      <Stack.Screen name="budget/[id]" options={{ title: 'Detail Anggaran' }} />
      <Stack.Screen name="analytics/index" options={{ title: 'Analitik' }} />
      <Stack.Screen name="notifications/index" options={{ title: 'Notifikasi' }} />
      <Stack.Screen name="approvals/index" options={{ title: 'Persetujuan' }} />
      <Stack.Screen name="approvals/[id]" options={{ title: 'Detail Persetujuan' }} />
    </Stack>
  );
}
