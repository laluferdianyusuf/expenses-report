import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterForm } from '@/features/auth/schemas/auth.schema';
import { useRegister } from '@/queries/auth.queries';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const register = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      organizationName: '',
      phone: '',
    },
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Buat Akun Baru</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Daftarkan organisasi dan mulai kelola keuangan
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nama Lengkap"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />
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
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Telepon (opsional)"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="organizationName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nama Organisasi"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.organizationName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              title="Daftar"
              loading={register.isPending}
              onPress={handleSubmit((data) => register.mutate(data))}
            />
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.muted }}>Sudah punya akun? </Text>
            <Link href="/(auth)/login">
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Masuk</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, gap: 24 },
  header: { gap: 8, marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
});
