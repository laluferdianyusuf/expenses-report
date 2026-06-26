import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FAB } from '@/components/ui/FAB';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { useBudgets } from '@/queries/budget.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import { EmptyState } from '@/components/ui/EmptyState';

function alertColor(level: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (level === 'OVER_BUDGET') return colors.danger;
  if (level.startsWith('WARNING')) return colors.warning;
  return colors.success;
}

export default function BudgetListScreen() {
  const { colors } = useTheme();
  const { data = [], isRefetching, refetch, isLoading } = useBudgets();

  return (
    <ScreenWrapper>
      {isLoading ? null : data.length === 0 ? (
        <EmptyState message="Belum ada anggaran" actionLabel="Buat Anggaran" onAction={() => router.push('/(tabs)/more/budget/create')} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const used = Number(item.usedAmount);
            const total = Number(item.budgetAmount);
            const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
            return (
              <Pressable onPress={() => router.push(`/(tabs)/more/budget/${item.id}`)}>
                <Card style={styles.card}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {item.category?.name ?? 'Anggaran'}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {formatCurrency(used, true)} / {formatCurrency(total, true)}
                  </Text>
                  <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: alertColor(item.alertLevel, colors) },
                      ]}
                    />
                  </View>
                  <Text style={{ color: alertColor(item.alertLevel, colors), fontSize: 12, marginTop: 6 }}>
                    {item.alertLevel.replace('_', ' ')}
                  </Text>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      <FAB href="/(tabs)/more/budget/create" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  card: { marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  barBg: { height: 8, borderRadius: 999, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
});
