import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

interface FABProps {
  href: Href;
}

export function FAB({ href }: FABProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={() => router.push(href)}
    >
      <Ionicons name="add" size={28} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
