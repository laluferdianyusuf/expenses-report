import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useTheme } from '@/hooks/useTheme';
import { runSync } from '@/features/sync/sync-engine';
import { setLastSyncAt, setSyncError, setSyncStats, setSyncing } from '@/store/slices/sync.slice';
import { syncQueueLocalRepo } from '@/features/offline/sqlite/repositories/sync-queue.local';
import { useState } from 'react';

export default function SyncStatusScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const { isOnline, isSyncing, pendingCount, failedCount, lastSyncAt, syncError } =
    useAppSelector((s) => s.sync);
  const queuedUploads = useAppSelector((s) => s.offline.queuedUploads.length);
  const [manualRunning, setManualRunning] = useState(false);

  const runManualSync = async () => {
    if (!orgId || !isOnline) return;
    setManualRunning(true);
    dispatch(setSyncing(true));
    try {
      const { synced, failed } = await runSync(orgId);
      const pending = await syncQueueLocalRepo.count();
      dispatch(setSyncStats({ pendingCount: pending, failedCount: failed }));
      dispatch(setLastSyncAt(new Date().toISOString()));
      dispatch(setSyncError(null));
      if (synced > 0) queryClient.invalidateQueries();
    } catch (error) {
      dispatch(setSyncError(error instanceof Error ? error.message : 'Sync gagal'));
    } finally {
      dispatch(setSyncing(false));
      setManualRunning(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Row label="Koneksi" value={isOnline ? 'Online' : 'Offline'} colors={colors} />
          <Row label="Menunggu sync" value={String(pendingCount)} colors={colors} />
          <Row label="Gagal" value={String(failedCount)} colors={colors} />
          <Row label="Antrian upload" value={String(queuedUploads)} colors={colors} />
          <Row
            label="Terakhir sync"
            value={lastSyncAt ? new Date(lastSyncAt).toLocaleString('id-ID') : '-'}
            colors={colors}
          />
        </Card>
        {syncError ? (
          <Text style={{ color: colors.danger, fontSize: 13 }}>{syncError}</Text>
        ) : null}
        <Button
          title={isSyncing || manualRunning ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
          loading={isSyncing || manualRunning}
          disabled={!isOnline}
          onPress={runManualSync}
        />
        {!isOnline ? (
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
            Perubahan offline akan di-sync otomatis saat online.
          </Text>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  card: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
