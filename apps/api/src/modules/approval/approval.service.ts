import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { TenantContext } from '../../common/interfaces';
import { ApproveRejectDto, SubmitApprovalDto } from './dto/approval.dto';
import { AccountingService } from '../accounting/accounting.service';
import { BudgetService } from '../budget/budget.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private accountingService: AccountingService,
    private budgetService: BudgetService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  findAll(ctx: TenantContext, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.prisma.approvalFlow.findMany({
        where: { organizationId: ctx.organizationId },
        skip,
        take: limit,
        include: {
          expense: { include: { category: true } },
          submitter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalFlow.count({ where: { organizationId: ctx.organizationId } }),
    ]).then(([data, total]) => ({
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  }

  findPending(ctx: TenantContext) {
    return this.prisma.approvalFlow.findMany({
      where: { organizationId: ctx.organizationId, status: 'PENDING' },
      include: {
        expense: { include: { category: true, creator: { select: { name: true } } } },
        submitter: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async findOne(ctx: TenantContext, id: string) {
    const flow = await this.prisma.approvalFlow.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        expense: { include: { category: true } },
        histories: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!flow) throw new NotFoundException('Approval not found');
    return flow;
  }

  async submit(ctx: TenantContext, dto: SubmitApprovalDto) {
    const flow = await this.prisma.approvalFlow.findFirst({
      where: {
        organizationId: ctx.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
      },
    });
    if (!flow) throw new NotFoundException('Approval flow not found');
    if (flow.status !== 'DRAFT' && flow.status !== 'REJECTED') {
      throw new BadRequestException('Cannot submit in current status');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: dto.entityId },
        data: { status: 'PENDING' },
      });
      const approval = await tx.approvalFlow.update({
        where: { id: flow.id },
        data: {
          status: 'PENDING',
          submittedAt: new Date(),
          submittedBy: ctx.userId,
          approvalLevel: 1,
        },
      });
      await tx.approvalHistory.create({
        data: {
          approvalFlowId: flow.id,
          organizationId: ctx.organizationId,
          actorId: ctx.userId,
          action: 'SUBMIT',
          fromStatus: flow.status,
          toStatus: 'PENDING',
        },
      });
      return approval;
    });

    await this.notificationsService.notifyApprovalRequest(ctx.organizationId, flow.id);
    await this.auditService.log(ctx, 'APPROVE', 'approval', flow.id, flow, updated);
    return updated;
  }

  async approve(ctx: TenantContext, id: string, dto: ApproveRejectDto) {
    const flow = await this.findOne(ctx, id);
    if (flow.status !== 'PENDING') {
      throw new BadRequestException('Only pending approvals can be approved');
    }

    const expense = flow.expense;
    if (!expense) throw new BadRequestException('Expense not found for approval');

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: expense.id },
        data: { status: 'APPROVED' },
      });
      await tx.approvalFlow.update({
        where: { id },
        data: { status: 'APPROVED', completedAt: new Date(), currentApproverId: ctx.userId },
      });
      await tx.approvalHistory.create({
        data: {
          approvalFlowId: id,
          organizationId: ctx.organizationId,
          actorId: ctx.userId,
          action: 'APPROVE',
          fromStatus: 'PENDING',
          toStatus: 'APPROVED',
          comment: dto.comment,
        },
      });
    });

    const fullExpense = await this.prisma.expense.findUnique({
      where: { id: expense.id },
      include: { category: true },
    });
    if (fullExpense) {
      await this.accountingService.createJournalFromExpense(
        ctx.organizationId,
        ctx.userId,
        fullExpense,
      );
      await this.budgetService.recalculateForExpense(ctx.organizationId, fullExpense);
    }

    await this.notificationsService.notifyApprovalResult(
      ctx.organizationId,
      expense.createdBy,
      'APPROVED',
      expense.id,
    );
    await this.auditService.log(ctx, 'APPROVE', 'expense', expense.id);
    return this.findOne(ctx, id);
  }

  async reject(ctx: TenantContext, id: string, dto: ApproveRejectDto) {
    const flow = await this.findOne(ctx, id);
    if (flow.status !== 'PENDING') {
      throw new BadRequestException('Only pending approvals can be rejected');
    }

    await this.prisma.$transaction(async (tx) => {
      if (flow.expenseId) {
        await tx.expense.update({
          where: { id: flow.expenseId },
          data: { status: 'REJECTED' },
        });
      }
      await tx.approvalFlow.update({
        where: { id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
          rejectionReason: dto.comment,
          currentApproverId: ctx.userId,
        },
      });
      await tx.approvalHistory.create({
        data: {
          approvalFlowId: id,
          organizationId: ctx.organizationId,
          actorId: ctx.userId,
          action: 'REJECT',
          fromStatus: 'PENDING',
          toStatus: 'REJECTED',
          comment: dto.comment,
        },
      });
    });

    if (flow.expense) {
      await this.notificationsService.notifyApprovalResult(
        ctx.organizationId,
        flow.expense.createdBy,
        'REJECTED',
        flow.expense.id,
      );
    }
    await this.auditService.log(ctx, 'REJECT', 'approval', id);
    return this.findOne(ctx, id);
  }

  async cancel(ctx: TenantContext, id: string) {
    const flow = await this.findOne(ctx, id);
    if (flow.status !== 'PENDING' && flow.status !== 'DRAFT') {
      throw new BadRequestException('Cannot cancel in current status');
    }

    await this.prisma.$transaction(async (tx) => {
      if (flow.expenseId) {
        await tx.expense.update({
          where: { id: flow.expenseId },
          data: { status: 'CANCELLED' },
        });
      }
      await tx.approvalFlow.update({
        where: { id },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
      await tx.approvalHistory.create({
        data: {
          approvalFlowId: id,
          organizationId: ctx.organizationId,
          actorId: ctx.userId,
          action: 'CANCEL',
          fromStatus: flow.status,
          toStatus: 'CANCELLED',
        },
      });
    });

    return this.findOne(ctx, id);
  }
}
