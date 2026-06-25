import { PrismaService } from '../../database/prisma.module';
import { PaginatedResult, PaginationOptions, TenantContext } from '../interfaces';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  protected tenantWhere(ctx: TenantContext) {
    return { organizationId: ctx.organizationId };
  }

  protected paginate(options: PaginationOptions) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    return { skip: (page - 1) * limit, take: limit, page, limit };
  }

  protected buildMeta(total: number, page: number, limit: number): PaginatedResult<never>['meta'] {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }
}
