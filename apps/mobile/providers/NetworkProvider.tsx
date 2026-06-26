import { ReactNode, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch } from '@/store/hooks';
import { setOnline } from '@/store/slices/sync.slice';

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(setOnline(state.isConnected ?? true));
    });
    return unsubscribe;
  }, [dispatch]);

  return <>{children}</>;
}
