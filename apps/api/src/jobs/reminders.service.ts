import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.module';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async dailyTransactionReminder() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });

    let notified = 0;

    for (const org of organizations) {
      const [incomeCount, expenseCount] = await Promise.all([
        this.prisma.income.count({
          where: {
            organizationId: org.id,
            deletedAt: null,
            transactionDate: { gte: todayStart },
          },
        }),
        this.prisma.expense.count({
          where: {
            organizationId: org.id,
            deletedAt: null,
            transactionDate: { gte: todayStart },
          },
        }),
      ]);

      if (incomeCount > 0 || expenseCount > 0) continue;

      const users = await this.getFinanceUsers(org.id);
      for (const user of users) {
        await this.notificationsService.createDirect(
          org.id,
          user.id,
          'Reminder: Belum Ada Transaksi',
          'Anda belum mencatat transaksi hari ini.',
          'TRANSACTION_REMINDER',
        );
        notified++;
      }
    }

    this.logger.log(`Daily transaction reminder sent to ${notified} users`);
    return { notified };
  }

  async income7DayReminder() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    return this.remindMissingActivity('income', since, 'INCOME_REMINDER', {
      title: 'Reminder: Belum Ada Pemasukan',
      body: 'Tidak ada pemasukan yang dicatat dalam 7 hari terakhir.',
    });
  }

  async expense7DayReminder() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    return this.remindMissingActivity('expense', since, 'EXPENSE_REMINDER', {
      title: 'Reminder: Belum Ada Pengeluaran',
      body: 'Tidak ada pengeluaran yang dicatat dalam 7 hari terakhir.',
    });
  }

  async targetReminder() {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const targets = await this.prisma.target.findMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: { lte: in7Days, gte: now },
      },
      include: { organization: true },
    });

    let notified = 0;

    for (const target of targets) {
      const progress =
        Number(target.targetAmount) > 0
          ? (Number(target.currentAmount) / Number(target.targetAmount)) * 100
          : 0;

      if (progress >= 100) continue;

      const users = await this.getFinanceUsers(target.organizationId);
      for (const user of users) {
        await this.notificationsService.createDirect(
          target.organizationId,
          user.id,
          'Target Belum Tercapai',
          `Target "${target.name}" baru ${progress.toFixed(0)}% — deadline ${target.endDate.toLocaleDateString()}.`,
          'TARGET_REMINDER',
          { targetId: target.id, progress },
        );
        notified++;
      }
    }

    this.logger.log(`Target reminders sent to ${notified} users`);
    return { notified };
  }

  async monthlyReportReminder() {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    let notified = 0;

    for (const org of organizations) {
      const users = await this.prisma.user.findMany({
        where: {
          organizationId: org.id,
          status: 'ACTIVE',
          role: { slug: { in: ['owner', 'finance'] } },
        },
      });

      for (const user of users) {
        await this.notificationsService.createDirect(
          org.id,
          user.id,
          'Reminder: Laporan Bulanan',
          'Jangan lupa membuat laporan keuangan bulanan.',
          'REPORT_REMINDER',
        );
        notified++;
      }
    }

    this.logger.log(`Monthly report reminders sent to ${notified} users`);
    return { notified };
  }

  private async remindMissingActivity(
    type: 'income' | 'expense',
    since: Date,
    notificationType: 'INCOME_REMINDER' | 'EXPENSE_REMINDER',
    message: { title: string; body: string },
  ) {
    const organizations = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    let notified = 0;

    for (const org of organizations) {
      const count =
        type === 'income'
          ? await this.prisma.income.count({
              where: { organizationId: org.id, deletedAt: null, transactionDate: { gte: since } },
            })
          : await this.prisma.expense.count({
              where: { organizationId: org.id, deletedAt: null, transactionDate: { gte: since } },
            });

      if (count > 0) continue;

      const users = await this.getFinanceUsers(org.id);
      for (const user of users) {
        await this.notificationsService.createDirect(
          org.id,
          user.id,
          message.title,
          message.body,
          notificationType,
        );
        notified++;
      }
    }

    this.logger.log(`${notificationType}: sent to ${notified} users`);
    return { notified };
  }

  private getFinanceUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        role: { slug: { in: ['staff', 'finance', 'owner'] } },
      },
    });
  }
}
