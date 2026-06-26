import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';

const MENU_ITEMS = [
  {
    icon: 'wallet-outline' as const,
    label: 'Anggaran',
    desc: 'Kelola budget & monitoring',
    href: '/(tabs)/more/budget',
  },
  {
    icon: 'bar-chart-outline' as const,
    label: 'Analitik',
    desc: 'Trend & health score',
    href: '/(tabs)/more/analytics',
  },
  {
    icon: 'notifications-outline' as const,
    label: 'Notifikasi',
    desc: 'Peringatan & push notification',
    href: '/(tabs)/more/notifications',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    label: 'Persetujuan',
    desc: 'Approval workflow',
    href: '/(tabs)/more/approvals',
  },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header title="Lainnya" subtitle="Fitur tambahan" />
        <ScrollView contentContainerStyle={styles.content}>
          {MENU_ITEMS.map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.href as never)}>
              <Card style={styles.menuItem}>
                <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.menuDesc, { color: colors.muted }]}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDesc: { fontSize: 12, marginTop: 2 },
});
