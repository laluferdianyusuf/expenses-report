import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import {
  authPersistConfig,
  organizationPersistConfig,
  offlinePersistConfig,
  uiPersistConfig,
} from './persist.config';
import authReducer from './slices/auth.slice';
import organizationReducer from './slices/organization.slice';
import uiReducer from './slices/ui.slice';
import syncReducer from './slices/sync.slice';
import offlineReducer from './slices/offline.slice';

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig as never, authReducer),
  organization: persistReducer(organizationPersistConfig as never, organizationReducer),
  ui: persistReducer(uiPersistConfig as never, uiReducer),
  sync: syncReducer,
  offline: persistReducer(offlinePersistConfig as never, offlineReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
