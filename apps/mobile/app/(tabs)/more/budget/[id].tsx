import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Skeleton } from '@/components/layout/ScreenWrapper';
import { useBudget } from '@/queries/budget.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data, isLoading } = useBudget(id);

  if (isLoading || !data) {
    return (
      <ScreenWrapper>
        <Skeleton height={140} style={{ margin: 16 }} />
      </ScreenWrapper>
    );
  }

  const used = Number(data.usedAmount);
  const total = Number(data.budgetAmount);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.text }]}>{data.category?.name}</Text>
          <Text style={{ color: colors.muted }}>Periode: {data.period}</Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(used)} / {formatCurrency(total)}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            {data.startDate.split('T')[0]} — {data.endDate.split('T')[0]}
          </Text>
          <Text style={{ color: colors.primary, marginTop: 12, fontWeight: '600' }}>
            Status: {data.alertLevel}
          </Text>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  amount: { fontSize: 22, fontWeight: '700', marginTop: 12 },
});
