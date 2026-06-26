import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/SelectInput';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import {
  createExpenseSchema,
  type CreateExpenseForm,
} from '@/features/income/schemas/income.schema';
import { useExpense, useUpdateExpense } from '@/queries/expense.queries';
import { useExpenseCategories } from '@/queries/category.queries';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: expense } = useExpense(id);
  const update = useUpdateExpense(id);
  const { data: categories = [] } = useExpenseCategories();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateExpenseForm>({
    resolver: zodResolver(createExpenseSchema),
    values: expense
      ? {
          categoryId: expense.categoryId,
          amount: Number(expense.amount),
          transactionDate: expense.transactionDate.split('T')[0],
          vendorName: expense.vendorName ?? '',
          description: expense.description ?? '',
        }
      : undefined,
  });

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { onChange, value } }) => (
            <SelectInput
              label="Kategori"
              value={value}
              options={categoryOptions}
              onChange={onChange}
              error={errors.categoryId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Jumlah (Rp)"
              keyboardType="numeric"
              value={value ? String(value) : ''}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        <Controller
          control={control}
          name="transactionDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Tanggal" value={value} onChangeText={onChange} onBlur={onBlur} />
          )}
        />
        <Controller
          control={control}
          name="vendorName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Vendor" value={value} onChangeText={onChange} onBlur={onBlur} />
          )}
        />
        <Button
          title="Simpan Perubahan"
          loading={update.isPending}
          onPress={handleSubmit((data) =>
            update.mutate(
              { ...data, amount: Number(data.amount) },
              { onSuccess: () => router.back() },
            ),
          )}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14 },
});
