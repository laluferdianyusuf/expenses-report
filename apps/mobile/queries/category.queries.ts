import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/services/api/category.api';
import { useAppSelector } from '@/store/hooks';
import { queryKeys } from './keys';

export function useIncomeCategories() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.categories.income(orgId!),
    queryFn: categoryApi.listIncome,
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useExpenseCategories() {
  const orgId = useAppSelector((s) => s.organization.currentOrgId);
  return useQuery({
    queryKey: queryKeys.categories.expense(orgId!),
    queryFn: categoryApi.listExpense,
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });
}
