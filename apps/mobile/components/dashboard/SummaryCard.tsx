import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import { Card } from '@/components/ui/Card';

interface SummaryCardProps {
  label: string;
  amount: number;
  variant?: 'default' | 'success' | 'danger';
}

export function SummaryCard({ label, amount, variant = 'default' }: SummaryCardProps) {
  const { colors } = useTheme();
  const tint =
    variant === 'success' ? colors.success : variant === 'danger' ? colors.danger : colors.primary;

  return (
    <Card style={styles.card}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.amount, { color: tint }]}>{formatCurrency(amount, true)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  label: { fontSize: 12, marginBottom: 4 },
  amount: { fontSize: 18, fontWeight: '700' },
});
