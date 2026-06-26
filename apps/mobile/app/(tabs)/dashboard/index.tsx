import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/layout/ScreenWrapper';
import { useDashboard } from '@/queries/dashboard.queries';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency } from '@/utils/currency';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const organization = useAppSelector((s) => s.auth.organization);
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header
          title={organization?.name ?? 'Dashboard'}
          subtitle="Ringkasan keuangan hari ini"
          right={<NotificationBell />}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
        >
          {isLoading ? (
            <View style={styles.gap}>
              <View style={styles.row}>
                <Skeleton height={80} style={styles.flex1} />
                <Skeleton height={80} style={styles.flex1} />
              </View>
              <Skeleton height={120} />
              <Skeleton height={180} />
            </View>
          ) : isError ? (
            <Card>
              <Text style={[styles.error, { color: colors.danger }]}>
                Gagal memuat dashboard. Tarik ke bawah untuk coba lagi.
              </Text>
            </Card>
          ) : data ? (
            <View style={styles.gap}>
              <View style={styles.row}>
                <SummaryCard label="Pemasukan Hari Ini" amount={data.today.income} variant="success" />
                <SummaryCard label="Pengeluaran Hari Ini" amount={data.today.expense} variant="danger" />
              </View>

              <Card>
                <Text style={[styles.balanceLabel, { color: colors.muted }]}>Saldo Saat Ini</Text>
                <Text style={[styles.balance, { color: colors.text }]}>
                  {formatCurrency(data.currentBalance)}
                </Text>
                <Text style={[styles.profit, { color: colors.success }]}>
                  Profit bulan ini: {formatCurrency(data.thisMonth.profit)}
                </Text>
              </Card>

              <Card>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bulan Ini</Text>
                <View style={styles.statRow}>
                  <Text style={{ color: colors.muted }}>Pemasukan</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {formatCurrency(data.thisMonth.income, true)}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={{ color: colors.muted }}>Pengeluaran</Text>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {formatCurrency(data.thisMonth.expense, true)}
                  </Text>
                </View>
              </Card>

              {(data.pendingApprovals > 0 || data.budgetAlerts > 0) && (
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Peringatan</Text>
                  {data.pendingApprovals > 0 ? (
                    <Text style={{ color: colors.warning }}>
                      {data.pendingApprovals} persetujuan menunggu
                    </Text>
                  ) : null}
                  {data.budgetAlerts > 0 ? (
                    <Text style={{ color: colors.danger, marginTop: 4 }}>
                      {data.budgetAlerts} anggaran perlu perhatian
                    </Text>
                  ) : null}
                </Card>
              )}

              <RecentTransactions transactions={data.recentTransactions} />
              <HealthScoreCard score={data.healthScore} />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  gap: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  balanceLabel: { fontSize: 13, marginBottom: 4 },
  balance: { fontSize: 28, fontWeight: '700' },
  profit: { fontSize: 13, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  error: { fontSize: 14, textAlign: 'center' },
});
