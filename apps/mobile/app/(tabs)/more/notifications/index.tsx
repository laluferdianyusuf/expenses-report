import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/layout/Header';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/queries/notifications.queries';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/date';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.data ?? [];

  return (
    <ScreenWrapper>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header
          title="Notifikasi"
          right={
            items.length > 0 ? (
              <Button
                title="Tandai dibaca"
                variant="ghost"
                onPress={() => markAllRead.mutate()}
              />
            ) : undefined
          }
        />
        {!isLoading && items.length === 0 ? (
          <EmptyState icon="notifications-outline" message="Belum ada notifikasi" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item.status === 'UNREAD') markRead.mutate(item.id);
                }}
              >
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: item.status === 'UNREAD' ? `${colors.primary}10` : colors.card,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.dotWrap}>
                    {item.status === 'UNREAD' ? (
                      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    ) : null}
                  </View>
                  <View style={styles.body}>
                    <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                      {item.body}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dotWrap: { width: 12, paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
});
