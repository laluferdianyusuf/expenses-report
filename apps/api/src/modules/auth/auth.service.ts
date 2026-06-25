import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.module';
import { seedOrganizationDefaults } from '../../database/seed-helpers';
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../../common/utils';
import {
  RefreshTokenRepository,
  SessionRepository,
} from './repositories/auth.repository';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from '../../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private sessionRepo: SessionRepository,
    private refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const ownerRole = await this.prisma.role.findUnique({
      where: { slug: 'owner' },
    });
    if (!ownerRole) {
      throw new BadRequestException('System roles not seeded. Run db:seed first.');
    }

    const passwordHash = await hashPassword(dto.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          passwordHash,
          organizationId: organization.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });

      return { organization, user };
    });

    await seedOrganizationDefaults(this.prisma, result.organization.id);

    const tokens = await this.createSessionAndTokens(
      result.user,
      dto.deviceInfo.deviceId,
      dto.deviceInfo.deviceName,
      dto.deviceInfo.deviceType,
      dto.deviceInfo.fcmToken,
      ip,
      userAgent,
    );

    return {
      user: this.sanitizeUser(result.user),
      organization: result.organization,
      tokens,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await verifyPassword(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.createSessionAndTokens(
      user,
      dto.deviceInfo.deviceId,
      dto.deviceInfo.deviceName,
      dto.deviceInfo.deviceType,
      dto.deviceInfo.fcmToken,
      ip,
      userAgent,
    );

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const stored = await this.refreshTokenRepo.findByHash(tokenHash);

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!stored.session.isActive) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found');
    }

    const newRefreshToken = generateToken();
    const newRefreshHash = hashToken(newRefreshToken);

    const newStored = await this.refreshTokenRepo.create({
      userId: user.id,
      sessionId: stored.sessionId,
      tokenHash: newRefreshHash,
      expiresAt: this.getRefreshExpiry(),
    });

    await this.refreshTokenRepo.revoke(stored.id, newStored.id);
    await this.sessionRepo.updateActivity(stored.sessionId);

    const accessToken = await this.signAccessToken(user, stored.sessionId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(user: JwtPayload) {
    await this.sessionRepo.revoke(user.sessionId);
    await this.refreshTokenRepo.revokeAllForUser(user.sub);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(user: JwtPayload) {
    await this.sessionRepo.revokeAllForUser(user.sub);
    await this.refreshTokenRepo.revokeAllForUser(user.sub);
    return { message: 'All sessions revoked' };
  }

  async getMe(user: JwtPayload) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        role: true,
        organization: true,
        branch: true,
      },
    });
    if (!dbUser) throw new UnauthorizedException();
    return this.sanitizeUser(dbUser);
  }

  async getSessions(userId: string) {
    return this.sessionRepo.findActiveByUser(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new BadRequestException('Session not found');
    await this.sessionRepo.revoke(sessionId);
    return { message: 'Session revoked' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.refreshTokenRepo.revokeAllForUser(userId);
    return { message: 'Password changed. Please login again.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      return { message: 'If email exists, reset link will be sent' };
    }

    const token = generateToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // TODO: Send email in production
    if (process.env.NODE_ENV === 'development') {
      return { message: 'Reset token generated', token };
    }
    return { message: 'If email exists, reset link will be sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { isUsed: true, usedAt: new Date() },
      }),
    ]);
    await this.refreshTokenRepo.revokeAllForUser(resetToken.userId);
    return { message: 'Password reset successful' };
  }

  private async createSessionAndTokens(
    user: {
      id: string;
      email: string;
      organizationId: string | null;
      roleId: string;
      role: { slug: string; rolePermissions: { permission: { slug: string } }[] };
    },
    deviceId: string,
    deviceName: string | undefined,
    deviceType: import('@prisma/client').DeviceType,
    fcmToken: string | undefined,
    ip?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionRepo.create({
      userId: user.id,
      organizationId: user.organizationId,
      deviceId,
      deviceName,
      deviceType,
      ipAddress: ip,
      userAgent,
      fcmToken,
      expiresAt: this.getRefreshExpiry(),
    });

    const refreshToken = generateToken();
    await this.refreshTokenRepo.create({
      userId: user.id,
      sessionId: session.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: this.getRefreshExpiry(),
    });

    const accessToken = await this.signAccessToken(user, session.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  private async signAccessToken(
    user: {
      id: string;
      email: string;
      organizationId: string | null;
      roleId: string;
      role: { slug: string; rolePermissions: { permission: { slug: string } }[] };
    },
    sessionId: string,
  ) {
    const permissions = user.role.rolePermissions.map((rp) => rp.permission.slug);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roleId: user.roleId,
      roleSlug: user.role.slug,
      permissions,
      sessionId,
    };
    return this.jwtService.signAsync(payload);
  }

  private getRefreshExpiry() {
    const days = 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
