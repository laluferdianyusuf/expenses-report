import { ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getPendingCount, runSync } from '@/features/sync/sync-engine';
import {
  setLastSyncAt,
  setOnline,
  setSyncError,
  setSyncStats,
  setSyncing,
} from '@/store/slices/sync.slice';
import { syncQueueLocalRepo } from '@/features/offline/sqlite/repositories/sync-queue.local';

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isOnline = useAppSelector((s) => s.sync.isOnline);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const orgId = useAppSelector((s) => s.organization.currentOrgId);

  useEffect(() => {
    syncQueueLocalRepo.count().then((pendingCount) => {
      dispatch(setSyncStats({ pendingCount, failedCount: 0 }));
    });
  }, [dispatch]);

  useEffect(() => {
    if (!isOnline || !isAuthenticated || !orgId) return;

    let cancelled = false;

    (async () => {
      dispatch(setSyncing(true));
      dispatch(setSyncError(null));
      try {
        const { synced, failed } = await runSync(orgId);
        if (cancelled) return;
        const pendingCount = await getPendingCount();
        dispatch(setSyncStats({ pendingCount, failedCount: failed }));
        dispatch(setLastSyncAt(new Date().toISOString()));
        if (synced > 0) {
          queryClient.invalidateQueries();
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(
            setSyncError(error instanceof Error ? error.message : 'Sinkronisasi gagal'),
          );
        }
      } finally {
        if (!cancelled) dispatch(setSyncing(false));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, isAuthenticated, orgId, dispatch, queryClient]);

  return <>{children}</>;
}
