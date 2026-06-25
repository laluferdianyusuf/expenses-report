import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.module';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
  ) {}

  findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]).then(([data, total]) => ({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  archive(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  }

  async registerDevice(userId: string, deviceId: string, fcmToken: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { userId, deviceId, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
    });

    if (session) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { fcmToken, lastActivityAt: new Date() },
      });
      return { message: 'FCM token registered for session' };
    }

    return { message: 'No active session found for device — login again' };
  }

  createDirect(
    organizationId: string,
    userId: string,
    title: string,
    body: string,
    type: import('@prisma/client').NotificationType,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.create(organizationId, userId, title, body, type, metadata);
  }

  private async create(
    organizationId: string,
    userId: string,
    title: string,
    body: string,
    type: import('@prisma/client').NotificationType,
    metadata?: Prisma.InputJsonValue,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId,
        title,
        body,
        type,
        channel: 'IN_APP',
        metadata: metadata ?? {},
      },
    });

    await this.sendPushToUser(userId, notification.id, title, body, {
      notificationId: notification.id,
      type,
    });

    return notification;
  }

  private async sendPushToUser(
    userId: string,
    notificationId: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, isActive: true, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = sessions
      .map((s) => s.fcmToken)
      .filter((t): t is string => !!t);

    if (tokens.length > 0) {
      const result = await this.fcm.sendToTokens(tokens, { title, body, data });
      if (result.success > 0) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { channel: 'PUSH' },
        });
      }
    }
  }

  async notifyApprovalRequest(organizationId: string, approvalFlowId: string) {
    const approvers = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { slug: { in: ['finance', 'owner'] } },
        status: 'ACTIVE',
      },
    });

    await Promise.all(
      approvers.map((user) =>
        this.create(
          organizationId,
          user.id,
          'Approval Required',
          'A new expense is waiting for your approval',
          'APPROVAL_REQUEST',
          { approvalFlowId },
        ),
      ),
    );
  }

  notifyApprovalResult(
    organizationId: string,
    userId: string,
    result: 'APPROVED' | 'REJECTED',
    expenseId: string,
  ) {
    return this.create(
      organizationId,
      userId,
      result === 'APPROVED' ? 'Expense Approved' : 'Expense Rejected',
      result === 'APPROVED'
        ? 'Your expense has been approved'
        : 'Your expense has been rejected',
      'APPROVAL_RESULT',
      { expenseId, result },
    );
  }

  async notifyBudgetAlert(
    organizationId: string,
    budget: { id: string; alertLevel: string; categoryId: string },
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { slug: { in: ['finance', 'owner'] } },
        status: 'ACTIVE',
      },
    });

    const type =
      budget.alertLevel === 'OVER_BUDGET' ? 'BUDGET_OVER' : 'BUDGET_WARNING';

    await Promise.all(
      users.map((user) =>
        this.create(
          organizationId,
          user.id,
          'Budget Alert',
          `Budget alert level: ${budget.alertLevel}`,
          type,
          { budgetId: budget.id },
        ),
      ),
    );
  }
}
