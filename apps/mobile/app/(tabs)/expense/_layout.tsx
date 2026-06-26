import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ExpenseLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pengeluaran', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Tambah Pengeluaran' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detail Pengeluaran' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Pengeluaran' }} />
    </Stack>
  );
}
