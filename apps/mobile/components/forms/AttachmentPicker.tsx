import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { pickDocument, pickImageFromGallery } from '@/services/upload/upload.service';
import type { PickedAttachment } from '@/types/upload.types';

interface AttachmentPickerProps {
  value: PickedAttachment | null;
  onChange: (file: PickedAttachment | null) => void;
  label?: string;
}

export function AttachmentPicker({ value, onChange, label = 'Lampiran' }: AttachmentPickerProps) {
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (source: 'gallery' | 'document') => {
    setError(null);
    try {
      const file =
        source === 'gallery' ? await pickImageFromGallery() : await pickDocument();
      if (file) onChange(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memilih file');
    }
  };

  const isImage = value?.mimeType.startsWith('image/');

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      {value ? (
        <View style={[styles.preview, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {isImage ? (
            <Image source={{ uri: value.uri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.pdfRow}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
              <Text style={{ color: colors.text, flex: 1 }} numberOfLines={2}>
                {value.fileName}
              </Text>
            </View>
          )}
          <Pressable onPress={() => onChange(null)} style={styles.remove}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={[styles.pickBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => handlePick('gallery')}
          >
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 13 }}>Galeri</Text>
          </Pressable>
          <Pressable
            style={[styles.pickBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => handlePick('document')}
          >
            <Ionicons name="document-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.text, fontSize: 13 }}>PDF / File</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text> : null}
      <Text style={{ color: colors.muted, fontSize: 11 }}>JPG, PNG, atau PDF — maks. 10MB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 10 },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: 180 },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  remove: { position: 'absolute', top: 8, right: 8 },
});
