import { categoryApi } from '@/services/api/category.api';
import { syncApi } from '@/services/api/sync.api';
import { processUploadQueue } from '@/features/sync/upload-queue';
import { getSyncMeta, setSyncMeta } from '@/features/offline/sqlite/database';
import { incomeLocalRepo } from '@/features/offline/sqlite/repositories/income.local';
import { expenseLocalRepo } from '@/features/offline/sqlite/repositories/expense.local';
import { syncQueueLocalRepo } from '@/features/offline/sqlite/repositories/sync-queue.local';
import type { Expense, Income } from '@/types/transaction.types';
import { getDeviceInfo } from '@/utils/device';

const LAST_PULL_KEY = 'lastPullAt';

export async function runSync(orgId: string): Promise<{ synced: number; failed: number }> {
  const deviceInfo = await getDeviceInfo();
  let synced = 0;
  let failed = 0;

  const queue = await syncQueueLocalRepo.getAll();
  if (queue.length > 0) {
    const pushResult = await syncApi.push({
      deviceId: deviceInfo.deviceId,
      items: queue.map((item) => ({
        entityType: item.entityType,
        entityId: item.entityId,
        action: item.action,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
      })),
    });

    for (const result of pushResult.results) {
      if (result.status === 'SUCCESS') {
        synced++;
        if (result.entityType === 'INCOME') {
          await incomeLocalRepo.markSynced(result.localId, result.serverId);
        } else {
          await expenseLocalRepo.markSynced(result.localId, result.serverId);
        }
        const queueItem = queue.find((q) => q.entityId === result.localId);
        if (queueItem) await syncQueueLocalRepo.remove(queueItem.id);
      } else {
        failed++;
        const queueItem = queue.find((q) => q.entityId === result.localId);
        if (queueItem) await syncQueueLocalRepo.markError(queueItem.id, result.error ?? 'Sync failed');
      }
    }
  }

  const since = (await getSyncMeta(`${LAST_PULL_KEY}:${orgId}`)) ?? new Date(0).toISOString();
  const pullResult = await syncApi.pull(since);

  if (pullResult.incomes?.length) {
    await incomeLocalRepo.upsertMany(
      orgId,
      pullResult.incomes as Income[],
    );
  }
  if (pullResult.expenses?.length) {
    await expenseLocalRepo.upsertMany(
      orgId,
      pullResult.expenses as Expense[],
    );
  }

  await setSyncMeta(`${LAST_PULL_KEY}:${orgId}`, new Date().toISOString());

  await processUploadQueue(orgId);

  try {
    const [incomeCats, expenseCats] = await Promise.all([
      categoryApi.listIncome(),
      categoryApi.listExpense(),
    ]);
    await setSyncMeta(`categories:${orgId}`, JSON.stringify({ incomeCats, expenseCats }));
  } catch {
    // categories cache is optional during pull
  }

  return { synced, failed };
}

export async function getPendingCount(): Promise<number> {
  return syncQueueLocalRepo.count();
}
