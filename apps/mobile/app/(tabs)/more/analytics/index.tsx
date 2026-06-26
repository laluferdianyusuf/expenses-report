import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import {
  useAnalyticsOverview,
  useHealthScore,
  useIncomeTrend,
  useExpenseTrend,
} from '@/queries/analytics.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/layout/ScreenWrapper';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const overview = useAnalyticsOverview({ period: 'MONTHLY' });
  const health = useHealthScore({ period: 'MONTHLY' });
  const incomeTrend = useIncomeTrend({ period: 'MONTHLY' });
  const expenseTrend = useExpenseTrend({ period: 'MONTHLY' });

  const isLoading = overview.isLoading || health.isLoading;

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={overview.isRefetching}
            onRefresh={() => {
              overview.refetch();
              health.refetch();
              incomeTrend.refetch();
              expenseTrend.refetch();
            }}
          />
        }
      >
        {isLoading ? (
          <>
            <Skeleton height={100} />
            <Skeleton height={80} />
          </>
        ) : overview.data ? (
          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Ringkasan Bulan Ini</Text>
            <View style={styles.row}>
              <View style={styles.stat}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Pemasukan</Text>
                <Text style={{ color: colors.success, fontWeight: '700' }}>
                  {formatCurrency(overview.data.totalIncome, true)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Pengeluaran</Text>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>
                  {formatCurrency(overview.data.totalExpense, true)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>Profit</Text>
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {formatCurrency(overview.data.profit, true)}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {health.data ? <HealthScoreCard score={health.data.score} /> : null}

        {incomeTrend.data && incomeTrend.data.length > 0 ? (
          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Trend Pemasukan</Text>
            {incomeTrend.data.slice(-6).map((point) => (
              <View key={point.date} style={[styles.trendRow, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>{point.label}</Text>
                <Text style={{ color: colors.success, fontWeight: '600' }}>
                  {formatCurrency(point.amount, true)}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        {expenseTrend.data && expenseTrend.data.length > 0 ? (
          <Card>
            <Text style={[styles.section, { color: colors.text }]}>Trend Pengeluaran</Text>
            {expenseTrend.data.slice(-6).map((point) => (
              <View key={point.date} style={[styles.trendRow, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.muted }}>{point.label}</Text>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>
                  {formatCurrency(point.amount, true)}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  section: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 4 },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
