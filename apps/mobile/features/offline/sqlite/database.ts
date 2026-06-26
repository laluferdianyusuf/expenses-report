import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  organization_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT,
  amount REAL NOT NULL,
  transaction_date TEXT NOT NULL,
  source_name TEXT,
  description TEXT,
  branch_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'SYNCED',
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  organization_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT,
  amount REAL NOT NULL,
  transaction_date TEXT NOT NULL,
  vendor_name TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  branch_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'SYNCED',
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  client_timestamp TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_incomes_org ON incomes(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_id);
`;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('fms.db');
  await dbInstance.execAsync(SCHEMA);
  return dbInstance;
}

export async function getSyncMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function clearLocalData(orgId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM incomes WHERE organization_id = ?', [orgId]);
  await db.runAsync('DELETE FROM expenses WHERE organization_id = ?', [orgId]);
  await db.runAsync('DELETE FROM categories WHERE organization_id = ?', [orgId]);
  await db.runAsync('DELETE FROM sync_queue');
}
