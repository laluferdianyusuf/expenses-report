import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  failedCount: number;
  isOnline: boolean;
  syncError: string | null;
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  failedCount: 0,
  isOnline: true,
  syncError: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setSyncStats: (
      state,
      action: PayloadAction<{ pendingCount: number; failedCount: number }>,
    ) => {
      state.pendingCount = action.payload.pendingCount;
      state.failedCount = action.payload.failedCount;
    },
    setLastSyncAt: (state, action: PayloadAction<string>) => {
      state.lastSyncAt = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
    },
  },
});

export const { setOnline, setSyncing, setSyncStats, setLastSyncAt, setSyncError } =
  syncSlice.actions;

export default syncSlice.reducer;
