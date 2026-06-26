import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '@/services/api/expense.api';
import { getErrorMessage } from '@/services/api/client';
import { expenseLocalRepo } from '@/features/offline/sqlite/repositories/expense.local';
import { syncQueueLocalRepo } from '@/features/offline/sqlite/repositories/sync-queue.local';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSyncStats } from '@/store/slices/sync.slice';
import { showToast } from '@/store/slices/ui.slice';
import type {
  CreateExpenseInput,
  Expense,
  ExpenseFilters,
  UpdateExpenseInput,
} from '@/types/transaction.types';
import { generateLocalId } from '@/utils/id';
import { queryKeys } from './keys';

async function refreshPendingCount(dispatch: ReturnType<typeof useAppDispatch>) {
  const pendingCount = await syncQueueLocalRepo.count();
  dispatch(setSyncStats({ pendingCount, failedCount: 0 }));
}

export function useExpenses(filters: ExpenseFilters = {}) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useQuery({
    queryKey: queryKeys.expenses.list(orgId!, filters),
    queryFn: async () => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const data = await expenseLocalRepo.findAll(orgId, filters);
        return { data, meta: { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
      }
      const result = await expenseApi.getAll(filters);
      await expenseLocalRepo.upsertMany(orgId, result.data);
      return result;
    },
    enabled: !!orgId,
  });
}

export function useExpense(id: string) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: async () => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const local = await expenseLocalRepo.findById(orgId, id);
        if (!local) throw new Error('Not found');
        return local;
      }
      return expenseApi.getById(id);
    },
    enabled: !!orgId && !!id,
  });
}

export function useCreateExpense() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        const localId = generateLocalId();
        const item: Expense = {
          id: localId,
          organizationId: orgId,
          status: 'DRAFT',
          ...input,
          syncStatus: 'PENDING',
          localId,
        };
        await expenseLocalRepo.insertLocal(orgId, item);
        await syncQueueLocalRepo.enqueue('EXPENSE', localId, 'CREATE', {
          ...input,
          localId,
        });
        await refreshPendingCount(dispatch);
        return item;
      }
      return expenseApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      dispatch(showToast({ type: 'success', message: 'Pengeluaran berhasil disimpan' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useUpdateExpense(id: string) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (input: UpdateExpenseInput) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        await expenseLocalRepo.updateLocal(orgId, id, input);
        await syncQueueLocalRepo.enqueue('EXPENSE', id, 'UPDATE', { ...input });
        await refreshPendingCount(dispatch);
        return { id, ...input } as Expense;
      }
      return expenseApi.update(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(orgId!) });
      dispatch(showToast({ type: 'success', message: 'Pengeluaran diperbarui' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useDeleteExpense() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const isOnline = useAppSelector((s) => s.sync.isOnline);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('No organization');
      if (!isOnline) {
        await expenseLocalRepo.softDelete(orgId, id);
        await syncQueueLocalRepo.enqueue('EXPENSE', id, 'DELETE', {});
        await refreshPendingCount(dispatch);
        return;
      }
      return expenseApi.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      dispatch(showToast({ type: 'success', message: 'Pengeluaran dihapus' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}
