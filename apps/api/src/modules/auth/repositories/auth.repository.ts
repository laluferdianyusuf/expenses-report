import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PrismaService } from '../../../database/prisma.module';
import { DeviceType } from '@prisma/client';

@Injectable()
export class SessionRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: {
    userId: string;
    organizationId: string | null;
    deviceId: string;
    deviceName?: string;
    deviceType: DeviceType;
    ipAddress?: string;
    userAgent?: string;
    fcmToken?: string;
    expiresAt: Date;
  }) {
    return this.prisma.userSession.create({ data });
  }

  findActiveByUser(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  revoke(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  revokeAllForUser(userId: string) {
    return this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  updateActivity(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }
}

@Injectable()
export class RefreshTokenRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: {
    userId: string;
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  revoke(id: string, replacedByTokenId?: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        replacedByTokenId,
      },
    });
  }

  revokeAllForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
}
