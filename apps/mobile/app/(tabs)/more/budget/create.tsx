import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/SelectInput';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import {
  createBudgetSchema,
  type CreateBudgetForm,
} from '@/features/income/schemas/income.schema';
import { useCreateBudget } from '@/queries/budget.queries';
import { useExpenseCategories } from '@/queries/category.queries';

const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

const PERIOD_OPTIONS = [
  { label: 'Bulanan', value: 'MONTHLY' },
  { label: 'Triwulan', value: 'QUARTERLY' },
  { label: 'Tahunan', value: 'YEARLY' },
  { label: 'Kustom', value: 'CUSTOM' },
];

export default function CreateBudgetScreen() {
  const create = useCreateBudget();
  const { data: categories = [] } = useExpenseCategories();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBudgetForm>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      categoryId: '',
      budgetAmount: 0,
      period: 'MONTHLY',
      startDate: monthStart,
      endDate: monthEnd,
    },
  });

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.form}>
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Kategori Pengeluaran"
              value={value}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              onChange={onChange}
              error={errors.categoryId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="budgetAmount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Jumlah Anggaran"
              keyboardType="numeric"
              value={value ? String(value) : ''}
              onChangeText={onChange}
              error={errors.budgetAmount?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="period"
          render={({ field: { onChange, value } }) => (
            <SelectInput label="Periode" value={value} options={PERIOD_OPTIONS} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="startDate"
          render={({ field: { onChange, value } }) => (
            <Input label="Mulai" value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="endDate"
          render={({ field: { onChange, value } }) => (
            <Input label="Selesai" value={value} onChangeText={onChange} />
          )}
        />
        <Button
          title="Simpan"
          loading={create.isPending}
          onPress={handleSubmit((data) =>
            create.mutate(
              { ...data, budgetAmount: Number(data.budgetAmount) },
              { onSuccess: () => router.back() },
            ),
          )}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({ form: { padding: 16, gap: 14 } });
