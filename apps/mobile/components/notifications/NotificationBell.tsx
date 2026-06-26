import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useUnreadNotificationCount } from '@/queries/notifications.queries';

export function NotificationBell() {
  const { colors } = useTheme();
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push('/(tabs)/more/notifications')}
      hitSlop={8}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
