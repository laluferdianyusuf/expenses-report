/**
 * FMS Enterprise — Database Seed
 * Run: npx prisma db seed
 *
 * Seeds system roles, permissions, and default chart of accounts template.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'Super Admin', slug: 'super_admin', description: 'Full platform access', isSystem: true },
  { name: 'Owner', slug: 'owner', description: 'Organization owner', isSystem: true },
  { name: 'Finance', slug: 'finance', description: 'Finance manager', isSystem: true },
  { name: 'Staff', slug: 'staff', description: 'Staff member', isSystem: true },
  { name: 'Auditor', slug: 'auditor', description: 'Read-only auditor', isSystem: true },
] as const;

const PERMISSIONS = [
  // Auth & Users
  { name: 'View Users', slug: 'users:read', module: 'users', action: 'read' },
  { name: 'Create Users', slug: 'users:create', module: 'users', action: 'create' },
  { name: 'Update Users', slug: 'users:update', module: 'users', action: 'update' },
  { name: 'Delete Users', slug: 'users:delete', module: 'users', action: 'delete' },
  // Organization
  { name: 'View Organization', slug: 'organizations:read', module: 'organizations', action: 'read' },
  { name: 'Manage Organization', slug: 'organizations:manage', module: 'organizations', action: 'manage' },
  // Income
  { name: 'View Income', slug: 'income:read', module: 'income', action: 'read' },
  { name: 'Create Income', slug: 'income:create', module: 'income', action: 'create' },
  { name: 'Update Income', slug: 'income:update', module: 'income', action: 'update' },
  { name: 'Delete Income', slug: 'income:delete', module: 'income', action: 'delete' },
  // Expense
  { name: 'View Expense', slug: 'expense:read', module: 'expense', action: 'read' },
  { name: 'Create Expense', slug: 'expense:create', module: 'expense', action: 'create' },
  { name: 'Update Expense', slug: 'expense:update', module: 'expense', action: 'update' },
  { name: 'Delete Expense', slug: 'expense:delete', module: 'expense', action: 'delete' },
  // Approval
  { name: 'Approve Transactions', slug: 'approval:approve', module: 'approval', action: 'approve' },
  { name: 'Reject Transactions', slug: 'approval:reject', module: 'approval', action: 'reject' },
  // Reports & Analytics
  { name: 'View Reports', slug: 'reports:read', module: 'reports', action: 'read' },
  { name: 'Export Reports', slug: 'reports:export', module: 'reports', action: 'export' },
  { name: 'View Analytics', slug: 'analytics:read', module: 'analytics', action: 'read' },
  // Budget & Target
  { name: 'Manage Budget', slug: 'budget:manage', module: 'budget', action: 'manage' },
  { name: 'Manage Target', slug: 'target:manage', module: 'target', action: 'manage' },
  // Accounting
  { name: 'View Accounting', slug: 'accounting:read', module: 'accounting', action: 'read' },
  { name: 'Manage Journal', slug: 'accounting:manage', module: 'accounting', action: 'manage' },
  // Audit
  { name: 'View Audit Logs', slug: 'audit:read', module: 'audit', action: 'read' },
] as const;

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: PERMISSIONS.map((p) => p.slug),
  owner: [
    'users:read', 'organizations:read', 'organizations:manage',
    'income:read', 'expense:read', 'approval:approve', 'approval:reject',
    'reports:read', 'reports:export', 'analytics:read',
    'budget:manage', 'target:manage', 'accounting:read', 'audit:read',
  ],
  finance: [
    'income:read', 'income:create', 'income:update', 'income:delete',
    'expense:read', 'expense:create', 'expense:update', 'expense:delete',
    'approval:approve', 'approval:reject',
    'reports:read', 'reports:export', 'analytics:read',
    'budget:manage', 'target:manage', 'accounting:read', 'accounting:manage',
  ],
  staff: [
    'income:read', 'income:create',
    'expense:read', 'expense:create',
  ],
  auditor: [
    'income:read', 'expense:read', 'reports:read', 'analytics:read',
    'accounting:read', 'audit:read',
  ],
};

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

async function seedRolesAndPermissions() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {},
      create: role,
    });
  }

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    });
  }

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const permMap = Object.fromEntries(permissions.map((p) => [p.slug, p.id]));

  for (const role of roles) {
    const slugs = ROLE_PERMISSION_MAP[role.slug] ?? [];
    for (const slug of slugs) {
      const permissionId = permMap[slug];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

/** Call when creating a new organization */
export async function seedOrganizationDefaults(organizationId: string) {
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

async function main() {
  console.log('Seeding roles & permissions...');
  await seedRolesAndPermissions();
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
