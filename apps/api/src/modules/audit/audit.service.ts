import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(
    ctx: TenantContext,
    action: AuditAction,
    entity: string,
    entityId?: string,
    oldData?: unknown,
    newData?: unknown,
  ) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action,
        entity,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
      },
    });
  }

  findAll(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.auditLog.findMany({
        where: { organizationId },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where: { organizationId } }),
    ]).then(([data, total]) => ({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  }
}
