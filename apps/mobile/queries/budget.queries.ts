import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '@/services/api/budget.api';
import { getErrorMessage } from '@/services/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showToast } from '@/store/slices/ui.slice';
import type { CreateBudgetInput } from '@/types/budget.types';
import { queryKeys } from './keys';

export function useBudgets() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.budgets.all(orgId!),
    queryFn: budgetApi.getAll,
    enabled: !!orgId,
  });
}

export function useBudgetMonitoring() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.budgets.monitoring(orgId!),
    queryFn: budgetApi.getMonitoring,
    enabled: !!orgId,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.budgets.detail(id),
    queryFn: () => budgetApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);

  return useMutation({
    mutationFn: (input: CreateBudgetInput) => budgetApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all(orgId!) });
      dispatch(showToast({ type: 'success', message: 'Anggaran berhasil dibuat' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}
