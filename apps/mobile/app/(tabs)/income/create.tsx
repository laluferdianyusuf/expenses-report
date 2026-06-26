import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/SelectInput';
import { AttachmentPicker } from '@/components/forms/AttachmentPicker';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import {
  createIncomeSchema,
  type CreateIncomeForm,
} from '@/features/income/schemas/income.schema';
import { useCreateIncome } from '@/queries/income.queries';
import { useIncomeCategories } from '@/queries/category.queries';
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/slices/ui.slice';
import type { PickedAttachment } from '@/types/upload.types';
import { getErrorMessage } from '@/services/api/client';

const today = new Date().toISOString().split('T')[0];

export default function CreateIncomeScreen() {
  const dispatch = useAppDispatch();
  const create = useCreateIncome();
  const { uploadOrQueue } = useAttachmentUpload();
  const { data: categories = [] } = useIncomeCategories();
  const [attachment, setAttachment] = useState<PickedAttachment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIncomeForm>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
      transactionDate: today,
      sourceName: '',
      description: '',
    },
  });

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));

  const onSubmit = async (data: CreateIncomeForm) => {
    setSubmitting(true);
    try {
      const income = await create.mutateAsync({ ...data, amount: Number(data.amount) });
      if (attachment) {
        await uploadOrQueue(attachment, 'INCOME', income.id);
      }
      router.back();
    } catch (error) {
      dispatch(showToast({ type: 'error', message: getErrorMessage(error) }));
    } finally {
      setSubmitting(false);
    }
  };

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
              onChangeText={(t) => onChange(t)}
              onBlur={onBlur}
              error={errors.amount?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="transactionDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Tanggal (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.transactionDate?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="sourceName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Sumber" value={value} onChangeText={onChange} onBlur={onBlur} />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Keterangan"
              multiline
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        <AttachmentPicker value={attachment} onChange={setAttachment} />
        <Button
          title="Simpan"
          loading={create.isPending || submitting}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 14 },
});
