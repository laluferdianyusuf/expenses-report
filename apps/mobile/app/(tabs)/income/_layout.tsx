import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function IncomeLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Pemasukan', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Tambah Pemasukan' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detail Pemasukan' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Pemasukan' }} />
    </Stack>
  );
}
