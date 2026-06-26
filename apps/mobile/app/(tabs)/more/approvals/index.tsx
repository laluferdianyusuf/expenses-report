import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePendingApprovals } from '@/queries/approval.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';

export default function ApprovalsListScreen() {
  const { colors } = useTheme();
  const { data = [], isLoading, isRefetching, refetch } = usePendingApprovals();

  if (!isLoading && data.length === 0) {
    return (
      <ScreenWrapper>
        <EmptyState icon="checkmark-circle-outline" message="Tidak ada persetujuan menunggu" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(tabs)/more/approvals/${item.id}`)}>
            <Card style={styles.card}>
              <Text style={[styles.title, { color: colors.text }]}>
                {item.expense?.vendorName ?? item.expense?.category?.name ?? 'Pengeluaran'}
              </Text>
              <Text style={{ color: colors.danger, fontWeight: '700', marginTop: 4 }}>
                {formatCurrency(item.expense?.amount ?? 0, true)}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                Diajukan oleh {item.submitter?.name ?? '-'}
              </Text>
            </Card>
          </Pressable>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  card: { marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '600' },
});
