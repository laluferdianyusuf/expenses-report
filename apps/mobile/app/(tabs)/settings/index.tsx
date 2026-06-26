import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useLogout } from '@/queries/auth.queries';

const LINKS = [
  { label: 'Keamanan & Biometrik', href: '/(tabs)/settings/security', icon: 'finger-print-outline' as const },
  { label: 'Status Sinkronisasi', href: '/(tabs)/settings/sync-status', icon: 'cloud-outline' as const },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const organization = useAppSelector((s) => s.auth.organization);
  const logout = useLogout();

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header title="Pengaturan" />
        <View style={styles.content}>
          <Card style={styles.profile}>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
            <Text style={{ color: colors.muted }}>{user?.email}</Text>
            <Text style={[styles.org, { color: colors.primary }]}>{organization?.name}</Text>
          </Card>

          {LINKS.map((link) => (
            <Pressable key={link.href} onPress={() => router.push(link.href as never)}>
              <Card style={styles.linkRow}>
                <Ionicons name={link.icon} size={22} color={colors.primary} />
                <Text style={[styles.linkText, { color: colors.text }]}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))}

          <Button
            title="Keluar"
            variant="danger"
            loading={logout.isPending}
            onPress={() => logout.mutate()}
          />
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  profile: { gap: 4 },
  name: { fontSize: 18, fontWeight: '700' },
  org: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  linkText: { flex: 1, fontSize: 15, fontWeight: '500' },
});
