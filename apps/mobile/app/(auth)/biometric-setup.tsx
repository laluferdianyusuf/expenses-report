import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useBiometric } from '@/hooks/useBiometric';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/hooks/useTheme';

export default function BiometricSetupScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const { enableBiometric, checkHardware } = useBiometric();

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Aktifkan Login Biometrik?</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Login lebih cepat dengan sidik jari atau Face ID di perangkat Anda.
        </Text>
        <View style={styles.actions}>
          <Button
            title="Aktifkan"
            onPress={async () => {
              const available = await checkHardware();
              if (available && user?.email) {
                const ok = await enableBiometric(user.email);
                if (ok) router.replace('/(tabs)/dashboard');
              }
            }}
          />
          <Button title="Nanti Saja" variant="ghost" onPress={() => router.replace('/(tabs)/dashboard')} />
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  actions: { gap: 12, marginTop: 24 },
});
