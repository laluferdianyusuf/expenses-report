import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api/analytics.api';
import { useAppSelector } from '@/store/hooks';
import type { AnalyticsQuery } from '@/types/analytics.types';
import { queryKeys } from './keys';

export function useAnalyticsOverview(query: AnalyticsQuery = { period: 'MONTHLY' }) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.analytics.overview(orgId!, query),
    queryFn: () => analyticsApi.getOverview(query),
    enabled: !!orgId,
  });
}

export function useHealthScore(query: AnalyticsQuery = { period: 'MONTHLY' }) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.analytics.healthScore(orgId!),
    queryFn: () => analyticsApi.getHealthScore(query),
    enabled: !!orgId,
  });
}

export function useIncomeTrend(query: AnalyticsQuery = { period: 'MONTHLY' }) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.analytics.incomeTrend(orgId!),
    queryFn: () => analyticsApi.getIncomeTrend(query),
    enabled: !!orgId,
  });
}

export function useExpenseTrend(query: AnalyticsQuery = { period: 'MONTHLY' }) {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.analytics.expenseTrend(orgId!),
    queryFn: () => analyticsApi.getExpenseTrend(query),
    enabled: !!orgId,
  });
}
