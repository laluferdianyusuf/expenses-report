import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AttachmentEntityType, PickedAttachment } from '@/types/upload.types';

interface LocalTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface QueuedUpload {
  id: string;
  uri: string;
  fileName: string;
  mimeType: PickedAttachment['mimeType'];
  fileSize: number;
  entityType: AttachmentEntityType;
  entityId: string;
}

interface OfflineState {
  pendingTransactions: LocalTransaction[];
  queuedUploads: QueuedUpload[];
}

const initialState: OfflineState = {
  pendingTransactions: [],
  queuedUploads: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    addPendingTransaction: (state, action: PayloadAction<LocalTransaction>) => {
      state.pendingTransactions.push(action.payload);
    },
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(
        (t) => t.id !== action.payload,
      );
    },
    clearPendingTransactions: (state) => {
      state.pendingTransactions = [];
    },
    addQueuedUpload: (state, action: PayloadAction<QueuedUpload>) => {
      state.queuedUploads.push(action.payload);
    },
    removeQueuedUpload: (state, action: PayloadAction<string>) => {
      state.queuedUploads = state.queuedUploads.filter((u) => u.id !== action.payload);
    },
    clearQueuedUploads: (state) => {
      state.queuedUploads = [];
    },
  },
});

export const {
  addPendingTransaction,
  removePendingTransaction,
  clearPendingTransactions,
  addQueuedUpload,
  removeQueuedUpload,
  clearQueuedUploads,
} = offlineSlice.actions;

export default offlineSlice.reducer;
