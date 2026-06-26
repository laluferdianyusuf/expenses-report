import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { FAB } from '@/components/ui/FAB';
import { SyncIndicator } from '@/components/sync/SyncIndicator';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useExpenses } from '@/queries/expense.queries';
import { Skeleton } from '@/components/layout/ScreenWrapper';

export default function ExpenseListScreen() {
  const { data, isLoading, isRefetching, refetch } = useExpenses({ limit: 50 });

  const items = useMemo(
    () =>
      (data?.data ?? []).map((item) => ({
        id: item.id,
        title: item.vendorName ?? item.category?.name ?? 'Pengeluaran',
        subtitle: item.category?.name,
        amount: item.amount,
        date: item.transactionDate,
        type: 'EXPENSE' as const,
        syncStatus: item.syncStatus,
        statusLabel: item.status !== 'APPROVED' ? item.status : undefined,
      })),
    [data],
  );

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header title="Pengeluaran" subtitle="Daftar transaksi pengeluaran" />
        <SyncIndicator />
        {isLoading ? (
          <View style={styles.loading}>
            <Skeleton height={64} />
            <Skeleton height={64} />
          </View>
        ) : (
          <TransactionList
            items={items}
            detailRoute={(id) => `/(tabs)/expense/${id}`}
            isRefetching={isRefetching}
            onRefresh={() => refetch()}
          />
        )}
        <FAB href="/(tabs)/expense/create" />
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: 16, gap: 8 },
});
