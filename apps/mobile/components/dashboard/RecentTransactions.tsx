import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/currency';
import type { RecentTransaction } from '@/types/dashboard.types';
import { formatRelativeTime } from '@/utils/date';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Transaksi Terbaru</Text>
      {transactions.length === 0 ? (
        <Text style={[styles.empty, { color: colors.muted }]}>Belum ada transaksi</Text>
      ) : (
        transactions.map((tx) => {
          const isIncome = tx.type === 'INCOME';
          return (
            <View key={tx.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={styles.left}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {tx.description ?? tx.category}
                </Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  {tx.category} · {formatRelativeTime(tx.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.amount,
                  { color: isIncome ? colors.success : colors.danger },
                ]}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(tx.amount, true)}
              </Text>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  empty: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, paddingRight: 12 },
  name: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '600' },
});
