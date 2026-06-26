import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  theme: 'light' | 'dark' | 'system';
  isSidebarOpen: boolean;
  activeModal: string | null;
  toast: ToastMessage | null;
  lastSelectedBranch: string | null;
}

const initialState: UiState = {
  theme: 'system',
  isSidebarOpen: false,
  activeModal: null,
  toast: null,
  lastSelectedBranch: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<UiState['theme']>) => {
      state.theme = action.payload;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    showToast: (state, action: PayloadAction<ToastMessage>) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setLastSelectedBranch: (state, action: PayloadAction<string | null>) => {
      state.lastSelectedBranch = action.payload;
    },
  },
});

export const { setTheme, setSidebarOpen, showToast, clearToast, setLastSelectedBranch } =
  uiSlice.actions;

export default uiSlice.reducer;
