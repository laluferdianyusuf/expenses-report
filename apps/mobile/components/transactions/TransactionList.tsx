import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import { formatRelativeTime } from '@/utils/date';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SyncStatus } from '@/types/transaction.types';

export interface TransactionListItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: number | string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  syncStatus?: SyncStatus;
  statusLabel?: string;
}

interface TransactionListProps {
  items: TransactionListItem[];
  detailRoute: (id: string) => Href;
  isLoading?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
}

export function TransactionList({
  items,
  detailRoute,
  isLoading,
  isRefetching,
  onRefresh,
  emptyMessage = 'Belum ada transaksi',
}: TransactionListProps) {
  const router = useRouter();
  const { colors } = useTheme();

  if (!isLoading && items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!isRefetching} onRefresh={onRefresh} />
        ) : undefined
      }
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => router.push(detailRoute(item.id))}
        >
          <View style={styles.left}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {item.subtitle ?? ''} · {formatRelativeTime(item.date)}
            </Text>
            {item.syncStatus === 'PENDING' ? (
              <Text style={[styles.pending, { color: colors.warning }]}>Menunggu sync</Text>
            ) : null}
            {item.statusLabel ? (
              <Text style={[styles.pending, { color: colors.primary }]}>{item.statusLabel}</Text>
            ) : null}
          </View>
          <Text
            style={[
              styles.amount,
              { color: item.type === 'INCOME' ? colors.success : colors.danger },
            ]}
          >
            {item.type === 'INCOME' ? '+' : '-'}
            {formatCurrency(item.amount, true)}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, paddingRight: 12 },
  title: { fontSize: 15, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  pending: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  amount: { fontSize: 15, fontWeight: '600' },
});
