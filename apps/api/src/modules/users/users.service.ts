import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { hashPassword } from '../../common/utils';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAll(ctx: TenantContext, query: PaginationDto) {
    const { skip, take, page, limit } = this.paginate(query);
    const where = { ...this.tenantWhere(ctx), deletedAt: null };
    return Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        include: { role: true, branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]).then(([data, total]) => ({
      data: data.map(({ passwordHash: _, ...u }) => u),
      meta: this.buildMeta(total, page, limit),
    }));
  }

  findById(ctx: TenantContext, id: string) {
    return this.prisma.user.findFirst({
      where: { id, ...this.tenantWhere(ctx), deletedAt: null },
      include: { role: true, branch: true, organization: true },
    });
  }

  create(ctx: TenantContext, dto: CreateUserDto) {
    return hashPassword(dto.password).then((passwordHash) =>
      this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          roleId: dto.roleId,
          branchId: dto.branchId,
          passwordHash,
          organizationId: ctx.organizationId,
          status: 'ACTIVE',
        },
        include: { role: true, branch: true },
      }),
    );
  }

  update(ctx: TenantContext, id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id, organizationId: ctx.organizationId },
      data: dto,
      include: { role: true, branch: true },
    });
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      include: { role: true, organization: true, branch: true },
    });
  }

  softDelete(ctx: TenantContext, id: string) {
    return this.prisma.user.update({
      where: { id, organizationId: ctx.organizationId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }
}

@Injectable()
export class UsersService {
  constructor(private userRepo: UserRepository) {}

  findAll(ctx: TenantContext, query: PaginationDto) {
    return this.userRepo.findAll(ctx, query);
  }

  async findOne(ctx: TenantContext, id: string) {
    const user = await this.userRepo.findById(ctx, id);
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async create(ctx: TenantContext, dto: CreateUserDto) {
    const user = await this.userRepo.create(ctx, dto);
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async update(ctx: TenantContext, id: string, dto: UpdateUserDto) {
    await this.findOne(ctx, id);
    const user = await this.userRepo.update(ctx, id, dto);
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.userRepo.updateProfile(userId, dto).then((user) => {
      const { passwordHash: _, ...rest } = user;
      return rest;
    });
  }

  async remove(ctx: TenantContext, id: string) {
    await this.findOne(ctx, id);
    await this.userRepo.softDelete(ctx, id);
    return { message: 'User deleted' };
  }
}
