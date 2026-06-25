import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  findAll(ctx: TenantContext) {
    return this.prisma.branch.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(ctx: TenantContext, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  create(ctx: TenantContext, dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: { ...dto, organizationId: ctx.organizationId },
    });
  }

  async update(ctx: TenantContext, id: string, dto: UpdateBranchDto) {
    await this.findOne(ctx, id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(ctx: TenantContext, id: string) {
    await this.findOne(ctx, id);
    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
