import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps extends ViewProps {
  height?: number;
  width?: number | `${number}%`;
}

export function Skeleton({ height = 20, width = '100%', style, ...props }: SkeletonProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.base, { height, width, backgroundColor: colors.border }, style]}
      {...props}
    />
  );
}

interface ScreenWrapperProps {
  children: ReactNode;
}

export function ScreenWrapper({ children }: ScreenWrapperProps) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: 8, opacity: 0.5 },
  screen: { flex: 1 },
});
