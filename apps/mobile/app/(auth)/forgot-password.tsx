import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from '@/features/auth/schemas/auth.schema';
import { useForgotPassword } from '@/queries/auth.queries';
import { useTheme } from '@/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const forgot = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Lupa Password</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Masukkan email untuk menerima link reset password
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          title="Kirim Link Reset"
          loading={forgot.isPending}
          onPress={handleSubmit((data) =>
            forgot.mutate(data.email, { onSuccess: () => router.back() }),
          )}
        />

        <Link href="/(auth)/login" style={styles.back}>
          <Text style={{ color: colors.primary }}>Kembali ke login</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, marginBottom: 8 },
  back: { alignSelf: 'center', marginTop: 8 },
});
