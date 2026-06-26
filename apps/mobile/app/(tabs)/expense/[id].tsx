import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Skeleton } from '@/components/layout/ScreenWrapper';
import { useExpense, useDeleteExpense } from '@/queries/expense.queries';
import { useSubmitApproval } from '@/queries/approval.queries';
import { useTheme } from '@/hooks/useTheme';
import { AttachmentPreview } from '@/components/forms/AttachmentPreview';
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload';
import { useState } from 'react';
import { AttachmentPicker } from '@/components/forms/AttachmentPicker';
import type { PickedAttachment } from '@/types/upload.types';
import { formatCurrency } from '@/utils/currency';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data, isLoading } = useExpense(id);
  const remove = useDeleteExpense();
  const submitApproval = useSubmitApproval();
  const { uploadOrQueue } = useAttachmentUpload();
  const [newAttachment, setNewAttachment] = useState<PickedAttachment | null>(null);
  const [uploading, setUploading] = useState(false);

  if (isLoading || !data) {
    return (
      <ScreenWrapper>
        <View style={styles.loading}>
          <Skeleton height={120} />
        </View>
      </ScreenWrapper>
    );
  }

  const canSubmit = data.status === 'DRAFT' || data.status === 'REJECTED';

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.amount, { color: colors.danger }]}>
            -{formatCurrency(data.amount)}
          </Text>
          <Text style={[styles.badge, { color: colors.primary }]}>{data.status}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>Kategori</Text>
          <Text style={{ color: colors.text }}>{data.category?.name ?? '-'}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>Tanggal</Text>
          <Text style={{ color: colors.text }}>{data.transactionDate.split('T')[0]}</Text>
          {data.vendorName ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Vendor</Text>
              <Text style={{ color: colors.text }}>{data.vendorName}</Text>
            </>
          ) : null}
          {data.description ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Keterangan</Text>
              <Text style={{ color: colors.text }}>{data.description}</Text>
            </>
          ) : null}
        </Card>
        {data.attachmentUrl ? <AttachmentPreview url={data.attachmentUrl} /> : null}
        {!data.attachmentUrl ? (
          <>
            <AttachmentPicker value={newAttachment} onChange={setNewAttachment} label="Tambah lampiran" />
            {newAttachment ? (
              <Button
                title="Unggah Lampiran"
                loading={uploading}
                onPress={async () => {
                  setUploading(true);
                  try {
                    await uploadOrQueue(newAttachment, 'EXPENSE', id);
                    setNewAttachment(null);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            ) : null}
          </>
        ) : null}
        {canSubmit ? (
          <Button
            title="Ajukan Persetujuan"
            loading={submitApproval.isPending}
            onPress={() => submitApproval.mutate(id)}
          />
        ) : null}
        <Button title="Edit" onPress={() => router.push(`/(tabs)/expense/edit/${id}`)} />
        <Button
          title="Hapus"
          variant="danger"
          loading={remove.isPending}
          onPress={() => remove.mutate(id, { onSuccess: () => router.replace('/(tabs)/expense') })}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  loading: { padding: 16 },
  amount: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  badge: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 12, marginTop: 12, marginBottom: 4 },
});
