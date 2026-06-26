import { getDatabase } from '../database';
import { generateLocalId } from '@/utils/id';
import type { SyncAction, SyncEntityType, SyncQueueItem } from '@/types/sync.types';

export const syncQueueLocalRepo = {
  async enqueue(
    entityType: SyncEntityType,
    entityId: string,
    action: SyncAction,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const db = await getDatabase();
    const id = generateLocalId();
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, client_timestamp, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, entityType, entityId, action, JSON.stringify(payload), new Date().toISOString()],
    );
    return id;
  },

  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM sync_queue ORDER BY client_timestamp ASC',
    );
    return rows.map((row) => ({
      id: row.id as string,
      entityType: row.entity_type as SyncEntityType,
      entityId: row.entity_id as string,
      action: row.action as SyncAction,
      payload: JSON.parse(row.payload as string),
      clientTimestamp: row.client_timestamp as string,
      retryCount: row.retry_count as number,
      error: row.error as string | null,
    }));
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue',
    );
    return row?.count ?? 0;
  },

  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  async markError(id: string, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sync_queue SET retry_count = retry_count + 1, error = ? WHERE id = ?',
      [error, id],
    );
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue');
  },
};
