export type SyncEntityType = 'INCOME' | 'EXPENSE';
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  clientTimestamp: string;
  retryCount: number;
  error?: string | null;
}

export interface SyncPushResult {
  syncLogId: string;
  itemsSynced: number;
  itemsFailed: number;
  results: Array<{
    localId: string;
    serverId: string;
    entityType: SyncEntityType;
    action: SyncAction;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
  }>;
}

export interface SyncPullResult {
  since: string;
  incomes?: unknown[];
  expenses?: unknown[];
  incomeCategories?: unknown[];
  expenseCategories?: unknown[];
}
