import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { FAB } from '@/components/ui/FAB';
import { SyncIndicator } from '@/components/sync/SyncIndicator';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useIncomes } from '@/queries/income.queries';
import { Skeleton } from '@/components/layout/ScreenWrapper';

export default function IncomeListScreen() {
  const { data, isLoading, isRefetching, refetch } = useIncomes({ limit: 50 });

  const items = useMemo(
    () =>
      (data?.data ?? []).map((item) => ({
        id: item.id,
        title: item.sourceName ?? item.category?.name ?? 'Pemasukan',
        subtitle: item.category?.name,
        amount: item.amount,
        date: item.transactionDate,
        type: 'INCOME' as const,
        syncStatus: item.syncStatus,
      })),
    [data],
  );

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header title="Pemasukan" subtitle="Daftar transaksi pemasukan" />
        <SyncIndicator />
        {isLoading ? (
          <View style={styles.loading}>
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </View>
        ) : (
          <TransactionList
            items={items}
            detailRoute={(id) => `/(tabs)/income/${id}`}
            isRefetching={isRefetching}
            onRefresh={() => refetch()}
          />
        )}
        <FAB href="/(tabs)/income/create" />
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { padding: 16, gap: 8 },
});
