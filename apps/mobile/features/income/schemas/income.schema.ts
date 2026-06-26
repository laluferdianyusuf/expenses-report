import { z } from 'zod';

export const createIncomeSchema = z.object({
  categoryId: z.string().uuid('Pilih kategori'),
  amount: z.coerce.number().positive('Jumlah harus positif'),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
  sourceName: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid('Pilih kategori'),
  amount: z.coerce.number().positive('Jumlah harus positif'),
  transactionDate: z.string().min(1, 'Tanggal wajib diisi'),
  vendorName: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export type CreateIncomeForm = z.infer<typeof createIncomeSchema>;
export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid('Pilih kategori'),
  budgetAmount: z.coerce.number().positive('Jumlah anggaran harus positif'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export type CreateBudgetForm = z.infer<typeof createBudgetSchema>;
