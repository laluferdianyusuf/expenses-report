import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useBiometric } from '@/hooks/useBiometric';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/hooks/useTheme';

export default function SecurityScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const { biometricEnabled, enableBiometric, disableBiometric, checkHardware } = useBiometric();

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.text }]}>Login Biometrik</Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Gunakan sidik jari atau Face ID untuk login cepat tanpa memasukkan password setiap
            kali.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 12 }}>
            Status: {biometricEnabled ? 'Aktif' : 'Nonaktif'}
          </Text>
        </Card>

        {biometricEnabled ? (
          <Button title="Nonaktifkan Biometrik" variant="secondary" onPress={() => disableBiometric()} />
        ) : (
          <Button
            title="Aktifkan Biometrik"
            onPress={async () => {
              const available = await checkHardware();
              if (available && user?.email) await enableBiometric(user.email);
            }}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
});
