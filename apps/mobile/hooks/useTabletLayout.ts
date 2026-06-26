import { useWindowDimensions } from 'react-native';

export function useTabletLayout() {
  const { width } = useWindowDimensions();
  return { isTablet: width >= 768 };
}
