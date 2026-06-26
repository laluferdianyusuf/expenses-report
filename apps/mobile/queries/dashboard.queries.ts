import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard.api';
import { useAppSelector } from '@/store/hooks';
import { queryKeys } from './keys';

export function useDashboard() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  const branchId = useAppSelector((s) => s.organization.selectedBranchId);

  return useQuery({
    queryKey: queryKeys.dashboard.stats(orgId!, branchId ?? undefined),
    queryFn: () => dashboardApi.getDashboard(branchId ?? undefined),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
}
