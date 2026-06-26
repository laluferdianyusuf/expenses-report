export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface AppNotification {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationTapPayload {
  type?: string;
  entityId?: string;
  entityType?: string;
}
