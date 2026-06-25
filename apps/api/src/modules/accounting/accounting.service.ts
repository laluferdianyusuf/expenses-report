import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { Decimal } from '@prisma/client/runtime/library';

const INCOME_ACCOUNT_MAP: Record<string, { debit: string; credit: string }> = {
  penjualan: { debit: '1000', credit: '4000' },
  jasa: { debit: '1000', credit: '4100' },
  donasi: { debit: '1000', credit: '4200' },
  default: { debit: '1000', credit: '4000' },
};

const EXPENSE_ACCOUNT_MAP: Record<string, { debit: string; credit: string }> = {
  operasional: { debit: '5000', credit: '1000' },
  gaji: { debit: '5100', credit: '1000' },
  marketing: { debit: '5200', credit: '1000' },
  default: { debit: '5000', credit: '1000' },
};

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async createJournalFromIncome(
    organizationId: string,
    userId: string,
    income: {
      id: string;
      amount: Decimal;
      transactionDate: Date;
      description: string | null;
      category: { slug: string };
    },
  ) {
    const mapping =
      INCOME_ACCOUNT_MAP[income.category.slug] ?? INCOME_ACCOUNT_MAP.default;

    const [debitAccount, creditAccount] = await Promise.all([
      this.getAccount(organizationId, mapping.debit),
      this.getAccount(organizationId, mapping.credit),
    ]);

    const amount = income.amount;
    const entryNumber = await this.nextEntryNumber(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          entryDate: income.transactionDate,
          description: income.description ?? `Income: ${income.category.slug}`,
          sourceType: 'INCOME',
          sourceId: income.id,
          incomeId: income.id,
          status: 'POSTED',
          totalDebit: amount,
          totalCredit: amount,
          createdBy: userId,
          postedAt: new Date(),
        },
      });

      await tx.journalDetail.createMany({
        data: [
          {
            journalEntryId: entry.id,
            organizationId,
            accountId: debitAccount.id,
            debit: amount,
            credit: 0,
            description: 'Debit Kas',
          },
          {
            journalEntryId: entry.id,
            organizationId,
            accountId: creditAccount.id,
            debit: 0,
            credit: amount,
            description: 'Credit Pendapatan',
          },
        ],
      });

      await tx.chartOfAccount.update({
        where: { id: debitAccount.id },
        data: { balance: { increment: amount } },
      });
      await tx.chartOfAccount.update({
        where: { id: creditAccount.id },
        data: { balance: { increment: amount } },
      });

      return entry;
    });
  }

  async createJournalFromExpense(
    organizationId: string,
    userId: string,
    expense: {
      id: string;
      amount: Decimal;
      transactionDate: Date;
      description: string | null;
      category: { slug: string };
    },
  ) {
    const mapping =
      EXPENSE_ACCOUNT_MAP[expense.category.slug] ?? EXPENSE_ACCOUNT_MAP.default;

    const [debitAccount, creditAccount] = await Promise.all([
      this.getAccount(organizationId, mapping.debit),
      this.getAccount(organizationId, mapping.credit),
    ]);

    const amount = expense.amount;
    const entryNumber = await this.nextEntryNumber(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          entryDate: expense.transactionDate,
          description: expense.description ?? `Expense: ${expense.category.slug}`,
          sourceType: 'EXPENSE',
          sourceId: expense.id,
          expenseId: expense.id,
          status: 'POSTED',
          totalDebit: amount,
          totalCredit: amount,
          createdBy: userId,
          postedAt: new Date(),
        },
      });

      await tx.journalDetail.createMany({
        data: [
          {
            journalEntryId: entry.id,
            organizationId,
            accountId: debitAccount.id,
            debit: amount,
            credit: 0,
          },
          {
            journalEntryId: entry.id,
            organizationId,
            accountId: creditAccount.id,
            debit: 0,
            credit: amount,
          },
        ],
      });

      await tx.chartOfAccount.update({
        where: { id: debitAccount.id },
        data: { balance: { increment: amount } },
      });
      await tx.chartOfAccount.update({
        where: { id: creditAccount.id },
        data: { balance: { decrement: amount } },
      });

      return entry;
    });
  }

  private async getAccount(organizationId: string, code: string) {
    const account = await this.prisma.chartOfAccount.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
    if (!account) throw new Error(`Account ${code} not found for organization`);
    return account;
  }

  private async nextEntryNumber(organizationId: string) {
    const count = await this.prisma.journalEntry.count({
      where: { organizationId },
    });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }
}
