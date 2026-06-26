import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Skeleton } from '@/components/layout/ScreenWrapper';
import { useApproval, useApproveExpense, useRejectExpense } from '@/queries/approval.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/currency';
import { useState } from 'react';

export default function ApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data, isLoading } = useApproval(id);
  const approve = useApproveExpense();
  const reject = useRejectExpense();
  const [comment, setComment] = useState('');

  if (isLoading || !data) {
    return (
      <ScreenWrapper>
        <Skeleton height={120} style={{ margin: 16 }} />
      </ScreenWrapper>
    );
  }

  const expense = data.expense;
  const isPending = data.status === 'PENDING';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.amount, { color: colors.danger }]}>
            {formatCurrency(expense?.amount ?? 0)}
          </Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {expense?.vendorName ?? expense?.category?.name}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            Status: {data.status}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            Pengaju: {data.submitter?.name}
          </Text>
        </Card>
        {isPending ? (
          <>
            <Input
              label="Komentar (opsional)"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <Button
              title="Setujui"
              loading={approve.isPending}
              onPress={() => approve.mutate({ id, comment: comment || undefined })}
            />
            <Button
              title="Tolak"
              variant="danger"
              loading={reject.isPending}
              onPress={() => reject.mutate({ id, comment: comment || undefined })}
            />
          </>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  amount: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
});
