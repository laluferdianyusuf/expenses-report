import { PrismaService } from './prisma.module';

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Penjualan', slug: 'penjualan', icon: 'shopping-cart', color: '#22C55E' },
  { name: 'Jasa', slug: 'jasa', icon: 'briefcase', color: '#2563EB' },
  { name: 'Donasi', slug: 'donasi', icon: 'heart', color: '#EC4899' },
  { name: 'Sponsor', slug: 'sponsor', icon: 'award', color: '#8B5CF6' },
  { name: 'Investasi', slug: 'investasi', icon: 'trending-up', color: '#F59E0B' },
  { name: 'Hibah', slug: 'hibah', icon: 'gift', color: '#14B8A6' },
  { name: 'Lainnya', slug: 'lainnya', icon: 'more-horizontal', color: '#6B7280' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Operasional', slug: 'operasional', icon: 'settings', color: '#6B7280' },
  { name: 'Gaji', slug: 'gaji', icon: 'users', color: '#2563EB' },
  { name: 'Marketing', slug: 'marketing', icon: 'megaphone', color: '#EC4899' },
  { name: 'Transportasi', slug: 'transportasi', icon: 'truck', color: '#F59E0B' },
  { name: 'Perjalanan Dinas', slug: 'perjalanan-dinas', icon: 'plane', color: '#8B5CF6' },
  { name: 'Pajak', slug: 'pajak', icon: 'file-text', color: '#EF4444' },
  { name: 'Aset', slug: 'aset', icon: 'package', color: '#14B8A6' },
  { name: 'Maintenance', slug: 'maintenance', icon: 'tool', color: '#22C55E' },
  { name: 'Lainnya', slug: 'lainnya', icon: 'more-horizontal', color: '#9CA3AF' },
];

const DEFAULT_CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Kas', accountType: 'ASSET' as const, level: 1 },
  { code: '1100', name: 'Bank', accountType: 'ASSET' as const, level: 1 },
  { code: '2000', name: 'Hutang Usaha', accountType: 'LIABILITY' as const, level: 1 },
  { code: '3000', name: 'Modal', accountType: 'EQUITY' as const, level: 1 },
  { code: '4000', name: 'Pendapatan Penjualan', accountType: 'REVENUE' as const, level: 1 },
  { code: '4100', name: 'Pendapatan Jasa', accountType: 'REVENUE' as const, level: 1 },
  { code: '4200', name: 'Pendapatan Donasi', accountType: 'REVENUE' as const, level: 1 },
  { code: '5000', name: 'Beban Operasional', accountType: 'EXPENSE' as const, level: 1 },
  { code: '5100', name: 'Beban Gaji', accountType: 'EXPENSE' as const, level: 1 },
  { code: '5200', name: 'Beban Marketing', accountType: 'EXPENSE' as const, level: 1 },
];

export async function seedOrganizationDefaults(
  prisma: PrismaService,
  organizationId: string,
) {
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await prisma.incomeCategory.create({
      data: { organizationId, ...cat, isDefault: true },
    });
  }
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.create({
      data: { organizationId, ...cat, isDefault: true },
    });
  }
  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    await prisma.chartOfAccount.create({
      data: { organizationId, ...account, isSystem: true },
    });
  }
}
