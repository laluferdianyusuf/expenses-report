import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalApi } from '@/services/api/approval.api';
import { getErrorMessage } from '@/services/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { showToast } from '@/store/slices/ui.slice';
import { queryKeys } from './keys';

export function useApprovals(page = 1) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: [...queryKeys.approvals.all(orgId!), page],
    queryFn: () => approvalApi.getAll(page),
    enabled: !!orgId,
  });
}

export function usePendingApprovals() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.approvals.pending(orgId!),
    queryFn: approvalApi.getPending,
    enabled: !!orgId,
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approvals.detail(id),
    queryFn: () => approvalApi.getById(id),
    enabled: !!id,
  });
}

export function useApproveExpense() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.approve(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      dispatch(showToast({ type: 'success', message: 'Pengeluaran disetujui' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useRejectExpense() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalApi.reject(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending(orgId!) });
      dispatch(showToast({ type: 'info', message: 'Pengeluaran ditolak' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}

export function useSubmitApproval() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const orgId = useAppSelector((s) => s.organization.currentOrgId);

  return useMutation({
    mutationFn: (entityId: string) => approvalApi.submit(entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all(orgId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.pending(orgId!) });
      dispatch(showToast({ type: 'success', message: 'Pengajuan persetujuan terkirim' }));
    },
    onError: (error) => {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    },
  });
}
