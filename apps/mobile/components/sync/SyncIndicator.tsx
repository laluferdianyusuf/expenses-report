import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/hooks/useTheme';

export function SyncIndicator() {
  const { colors } = useTheme();
  const { isSyncing, pendingCount, lastSyncAt } = useAppSelector((s) => s.sync);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  if (!isOnline && pendingCount === 0) return null;

  const label = isSyncing
    ? 'Menyinkronkan...'
    : pendingCount > 0
      ? `${pendingCount} perubahan menunggu sync`
      : lastSyncAt
        ? 'Tersinkron'
        : null;

  if (!label) return null;

  return (
    <View style={[styles.bar, { backgroundColor: isSyncing ? colors.primary : colors.border }]}>
      <Text style={[styles.text, { color: isSyncing ? '#fff' : colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingVertical: 4, paddingHorizontal: 16, alignItems: 'center' },
  text: { fontSize: 11, fontWeight: '500' },
});
