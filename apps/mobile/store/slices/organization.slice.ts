import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

interface OrganizationState {
  currentOrgId: string | null;
  branches: Branch[];
  selectedBranchId: string | null;
}

const initialState: OrganizationState = {
  currentOrgId: null,
  branches: [],
  selectedBranchId: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrg: (state, action: PayloadAction<string>) => {
      state.currentOrgId = action.payload;
    },
    setBranches: (state, action: PayloadAction<Branch[]>) => {
      state.branches = action.payload;
    },
    setSelectedBranch: (state, action: PayloadAction<string | null>) => {
      state.selectedBranchId = action.payload;
    },
    resetOrganization: (state) => {
      state.currentOrgId = null;
      state.branches = [];
      state.selectedBranchId = null;
    },
  },
});

export const { setCurrentOrg, setBranches, setSelectedBranch, resetOrganization } =
  organizationSlice.actions;

export default organizationSlice.reducer;
