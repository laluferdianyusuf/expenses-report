import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema, type LoginForm } from '@/features/auth/schemas/auth.schema';
import { useLogin } from '@/queries/auth.queries';
import { useBiometric } from '@/hooks/useBiometric';
import { useTheme } from '@/hooks/useTheme';
import { APP_NAME } from '@/constants/config';
import { getRefreshToken } from '@/services/storage/secure-storage';

export default function LoginScreen() {
  const { colors } = useTheme();
  const login = useLogin();
  const { loginWithBiometric, biometricEnabled, checkHardware } = useBiometric();
  const [showPassword, setShowPassword] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    getRefreshToken().then((token) => {
      if (token && biometricEnabled) setShowBiometric(true);
    });
  }, [biometricEnabled]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.appName, { color: colors.primary }]}>{APP_NAME}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Masuk ke akun Anda</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Kelola keuangan bisnis dari mana saja
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="nama@perusahaan.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Text
              style={[styles.togglePassword, { color: colors.primary }]}
              onPress={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            </Text>

            <Button
              title="Masuk"
              loading={login.isPending}
              onPress={handleSubmit((data) =>
                login.mutate(data, {
                  onSuccess: async () => {
                    const available = await checkHardware();
                    if (available && !biometricEnabled) {
                      router.replace('/(auth)/biometric-setup');
                    }
                  },
                }),
              )}
            />

            {showBiometric ? (
              <Button
                title="Login dengan Biometrik"
                variant="secondary"
                onPress={() => loginWithBiometric()}
              />
            ) : null}

            <Link href="/(auth)/forgot-password" style={styles.link}>
              <Text style={{ color: colors.primary }}>Lupa password?</Text>
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.muted }}>Belum punya akun? </Text>
            <Link href="/(auth)/register">
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Daftar</Text>
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
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  header: { gap: 8 },
  appName: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { gap: 16 },
  togglePassword: { fontSize: 13, alignSelf: 'flex-end' },
  link: { alignSelf: 'center', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
});
