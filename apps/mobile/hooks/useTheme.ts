import { useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { colors } from '@/constants/colors';
import { useAppSelector } from '@/store/hooks';

export function useTheme() {
  const themePref = useAppSelector((s) => s.ui.theme);
  const systemScheme = useSystemColorScheme();

  const isDark = useMemo(() => {
    if (themePref === 'system') return systemScheme === 'dark';
    return themePref === 'dark';
  }, [themePref, systemScheme]);

  return {
    isDark,
    colors: {
      primary: colors.primary,
      success: colors.success,
      danger: colors.danger,
      warning: colors.warning,
      background: isDark ? colors.background.dark : colors.background.light,
      card: isDark ? colors.card.dark : colors.card.light,
      text: isDark ? colors.text.dark : colors.text.light,
      muted: isDark ? colors.muted.dark : colors.muted.light,
      border: isDark ? colors.border.dark : colors.border.light,
    },
  };
}
