import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';

export function OfflineBanner() {
  const isOnline = useAppSelector((s) => s.sync.isOnline);
  const { colors } = useTheme();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.warning }]}>
      <Text style={styles.text}>Mode offline — perubahan akan disinkronkan nanti</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: 8, paddingHorizontal: 16 },
  text: { color: '#fff', fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
