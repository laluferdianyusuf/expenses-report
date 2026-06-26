import { getDatabase } from '../database';
import type { Income, IncomeFilters } from '@/types/transaction.types';
import type { SyncStatus } from '@/types/transaction.types';

function mapRow(row: Record<string, unknown>): Income {
  return {
    id: (row.server_id as string) ?? (row.id as string),
    organizationId: row.organization_id as string,
    categoryId: row.category_id as string,
    amount: row.amount as number,
    transactionDate: row.transaction_date as string,
    sourceName: row.source_name as string | null,
    description: row.description as string | null,
    branchId: row.branch_id as string | null,
    syncStatus: row.sync_status as SyncStatus,
    category: row.category_name
      ? { id: row.category_id as string, name: row.category_name as string }
      : undefined,
    localId: row.server_id ? undefined : (row.id as string),
    updatedAt: row.updated_at as string,
  };
}

export const incomeLocalRepo = {
  async upsertMany(orgId: string, items: Income[]): Promise<void> {
    const db = await getDatabase();
    for (const item of items) {
      const localId = item.localId ?? item.id;
      await db.runAsync(
        `INSERT OR REPLACE INTO incomes
         (id, server_id, organization_id, category_id, category_name, amount, transaction_date,
          source_name, description, branch_id, sync_status, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          localId,
          item.localId ? null : item.id,
          orgId,
          item.categoryId,
          item.category?.name ?? null,
          Number(item.amount),
          item.transactionDate,
          item.sourceName ?? null,
          item.description ?? null,
          item.branchId ?? null,
          item.syncStatus ?? 'SYNCED',
          item.updatedAt ?? new Date().toISOString(),
        ],
      );
    }
  },

  async findAll(orgId: string, filters: IncomeFilters = {}): Promise<Income[]> {
    const db = await getDatabase();
    let sql = `SELECT * FROM incomes WHERE organization_id = ? AND deleted_at IS NULL`;
    const params: unknown[] = [orgId];

    if (filters.search) {
      sql += ` AND (source_name LIKE ? OR description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.categoryId) {
      sql += ` AND category_id = ?`;
      params.push(filters.categoryId);
    }

    sql += ` ORDER BY transaction_date DESC LIMIT ?`;
    params.push(filters.limit ?? 50);

    const rows = await db.getAllAsync<Record<string, unknown>>(sql, params as (string | number | null)[]);
    return rows.map(mapRow);
  },

  async findById(orgId: string, id: string): Promise<Income | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM incomes WHERE organization_id = ? AND (id = ? OR server_id = ?) AND deleted_at IS NULL`,
      [orgId, id, id],
    );
    return row ? mapRow(row) : null;
  },

  async insertLocal(orgId: string, item: Income): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO incomes
       (id, server_id, organization_id, category_id, category_name, amount, transaction_date,
        source_name, description, branch_id, sync_status, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        item.id,
        orgId,
        item.categoryId,
        item.category?.name ?? null,
        Number(item.amount),
        item.transactionDate,
        item.sourceName ?? null,
        item.description ?? null,
        item.branchId ?? null,
        new Date().toISOString(),
      ],
    );
  },

  async markSynced(localId: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE incomes SET server_id = ?, sync_status = 'SYNCED', updated_at = ? WHERE id = ?`,
      [serverId, new Date().toISOString(), localId],
    );
  },

  async updateLocal(orgId: string, id: string, data: Partial<Income>): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE incomes SET
         category_id = COALESCE(?, category_id),
         amount = COALESCE(?, amount),
         transaction_date = COALESCE(?, transaction_date),
         source_name = COALESCE(?, source_name),
         description = COALESCE(?, description),
         sync_status = 'PENDING',
         updated_at = ?
       WHERE organization_id = ? AND (id = ? OR server_id = ?)`,
      [
        data.categoryId ?? null,
        data.amount != null ? Number(data.amount) : null,
        data.transactionDate ?? null,
        data.sourceName ?? null,
        data.description ?? null,
        new Date().toISOString(),
        orgId,
        id,
        id,
      ],
    );
  },

  async softDelete(orgId: string, id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE incomes SET deleted_at = ?, sync_status = 'PENDING', updated_at = ?
       WHERE organization_id = ? AND (id = ? OR server_id = ?)`,
      [new Date().toISOString(), new Date().toISOString(), orgId, id, id],
    );
  },
};
