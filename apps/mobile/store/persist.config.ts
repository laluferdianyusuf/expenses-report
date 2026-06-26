import AsyncStorage from '@react-native-async-storage/async-storage';

export const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'organization', 'isAuthenticated', 'biometricEnabled', 'permissions'],
};

export const uiPersistConfig = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: ['theme', 'lastSelectedBranch'],
};

export const organizationPersistConfig = {
  key: 'organization',
  storage: AsyncStorage,
  whitelist: ['currentOrgId', 'selectedBranchId', 'branches'],
};

export const offlinePersistConfig = {
  key: 'offline',
  storage: AsyncStorage,
  whitelist: ['queuedUploads'],
};
