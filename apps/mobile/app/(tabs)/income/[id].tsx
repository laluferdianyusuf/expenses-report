import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Skeleton } from '@/components/layout/ScreenWrapper';
import { useIncome, useDeleteIncome } from '@/queries/income.queries';
import { useTheme } from '@/hooks/useTheme';
import { AttachmentPreview } from '@/components/forms/AttachmentPreview';
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload';
import { useState } from 'react';
import { AttachmentPicker } from '@/components/forms/AttachmentPicker';
import { formatCurrency } from '@/utils/currency';
import type { PickedAttachment } from '@/types/upload.types';

export default function IncomeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data, isLoading } = useIncome(id);
  const remove = useDeleteIncome();
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

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.amount, { color: colors.success }]}>
            +{formatCurrency(data.amount)}
          </Text>
          <Text style={[styles.label, { color: colors.muted }]}>Kategori</Text>
          <Text style={{ color: colors.text }}>{data.category?.name ?? '-'}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>Tanggal</Text>
          <Text style={{ color: colors.text }}>{data.transactionDate.split('T')[0]}</Text>
          {data.sourceName ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Sumber</Text>
              <Text style={{ color: colors.text }}>{data.sourceName}</Text>
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
                    await uploadOrQueue(newAttachment, 'INCOME', id);
                    setNewAttachment(null);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            ) : null}
          </>
        ) : null}
        <Button title="Edit" onPress={() => router.push(`/(tabs)/income/edit/${id}`)} />
        <Button
          title="Hapus"
          variant="danger"
          loading={remove.isPending}
          onPress={() => remove.mutate(id, { onSuccess: () => router.replace('/(tabs)/income') })}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  loading: { padding: 16 },
  amount: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 12, marginTop: 12, marginBottom: 4 },
});
