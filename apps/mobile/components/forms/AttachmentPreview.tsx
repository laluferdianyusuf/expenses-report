import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface AttachmentPreviewProps {
  url: string;
  label?: string;
}

export function AttachmentPreview({ url, label = 'Lampiran' }: AttachmentPreviewProps) {
  const { colors } = useTheme();
  const isImage = /\.(jpe?g|png|webp)(\?|$)/i.test(url) || url.includes('image');

  const open = () => Linking.openURL(url);

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      {isImage ? (
        <Pressable onPress={open}>
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        </Pressable>
      ) : (
        <Pressable style={styles.fileRow} onPress={open}>
          <Ionicons name="document-attach-outline" size={22} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '500' }}>Buka lampiran</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  label: { fontSize: 12 },
  image: { width: '100%', height: 200, borderRadius: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
});
