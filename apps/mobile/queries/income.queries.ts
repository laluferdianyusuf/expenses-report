import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incomeApi } from '@/services/api/income.api';
import { getErrorMessage } from '@/services/api/client';
import { incomeLocalRepo } from '@/features/offline/sqlite/repositories/income.local';
import { syncQueueLocalRepo } from '@/features/offline/sqlite/repositories/sync-queue.local';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSyncStats } from '@/store/slices/sync.slice';
import { showToast } from '@/store/slices/ui.slice';
import type {
  CreateIncomeInput,
  Income,
  IncomeFilters,
  UpdateIncomeInput,
} from '@/types/transaction.types';
import { generateLocalId } from '@/utils/id';
import { queryKeys } from './keys';

async function refreshPendingCount(dispatch: ReturnType<typeof useAppDispatch>) {
  const pendingCount = await syncQueueLocalRepo.count();
  dispatch(setSyncStats({ pendingCount, failedCount: 0 }));
}

export function useIncomes(filters: IncomeFilters = {}) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useQuery({
    queryKey: queryKeys.incomes.list(orgId!, filters),
    queryFn: async () => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const data = await incomeLocalRepo.findAll(orgId, filters);
        return { data, meta: { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
      }
      const result = await incomeApi.getAll(filters);
      await incomeLocalRepo.upsertMany(orgId, result.data);
      return result;
    },
    enabled: !!orgId,
  });
}

export function useIncome(id: string) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useQuery({
    queryKey: queryKeys.incomes.detail(id),
    queryFn: async () => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const local = await incomeLocalRepo.findById(orgId, id);
        if (!local) throw new Error('Not found');
        return local;
      }
      return incomeApi.getById(id);
    },
    enabled: !!orgId && !!id,
  });
}

export function useCreateIncome() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (input: CreateIncomeInput) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const localId = generateLocalId();
        const item: Income = {
          id: localId,
          organizationId: orgId,
          ...input,
          syncStatus: 'PENDING',
          localId,
        };
        await incomeLocalRepo.insertLocal(orgId, item);
        await syncQueueLocalRepo.enqueue('INCOME', localId, 'CREATE', {
          ...input,
          localId,
        });
        await refreshPendingCount(dispatch);
        return item;
      }
      return incomeApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      dispatch(showToast({ type: 'success', message: 'Pemasukan berhasil disimpan' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useUpdateIncome(id: string) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (input: UpdateIncomeInput) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        await incomeLocalRepo.updateLocal(orgId, id, input);
        await syncQueueLocalRepo.enqueue('INCOME', id, 'UPDATE', { ...input });
        await refreshPendingCount(dispatch);
        return { id, ...input } as Income;
      }
      return incomeApi.update(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all(orgId!) });
      dispatch(showToast({ type: 'success', message: 'Pemasukan diperbarui' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useDeleteIncome() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        await incomeLocalRepo.softDelete(orgId, id);
        await syncQueueLocalRepo.enqueue('INCOME', id, 'DELETE', {});
        await refreshPendingCount(dispatch);
        return;
      }
      return incomeApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      dispatch(showToast({ type: 'success', message: 'Pemasukan dihapus' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}
