import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as customPackageService from "../services/customPackageService";

const initialState = {
  loading: false,
  estimating: false,
  saving: false,
  estimate: null,
  package: null,
  booking: null,
  details: null,
  error: null,
  success: false,
};

// Async Thunks
export const estimateCustomPackage = createAsyncThunk(
  "customPackage/estimate",
  async (packageData, { rejectWithValue }) => {
    try {
      const data = await customPackageService.estimatePackage(packageData);
      return data.estimate || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveCustomPackage = createAsyncThunk(
  "customPackage/save",
  async (packageData, { rejectWithValue }) => {
    try {
      const data = await customPackageService.savePackage(packageData);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadCustomPackageDetails = createAsyncThunk(
  "customPackage/loadDetails",
  async (packageId, { rejectWithValue }) => {
    try {
      const data = await customPackageService.getPackageDetails(packageId);
      return data.customPackage || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const customPackageSlice = createSlice({
  name: "customPackage",
  initialState,
  reducers: {
    clearCustomPackageError: (state) => {
      state.error = null;
    },
    resetCustomPackage: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Estimate
      .addCase(estimateCustomPackage.pending, (state) => {
        state.estimating = true;
        state.error = null;
      })
      .addCase(estimateCustomPackage.fulfilled, (state, action) => {
        state.estimating = false;
        state.estimate = action.payload;
        state.error = null;
      })
      .addCase(estimateCustomPackage.rejected, (state, action) => {
        state.estimating = false;
        state.error = action.payload;
      })
      // Save
      .addCase(saveCustomPackage.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveCustomPackage.fulfilled, (state, action) => {
        state.saving = false;
        // Fix: Use correct key name 'customPackage' returned by backend
        state.package = action.payload.customPackage || action.payload.package || null;
        state.booking = action.payload.booking || null;
        state.success = true;
        state.error = null;
      })
      .addCase(saveCustomPackage.rejected, (state, action) => {
        state.saving = false;
        state.success = false;
        state.error = action.payload;
      })
      // Details
      .addCase(loadCustomPackageDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCustomPackageDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.details = action.payload;
        state.error = null;
      })
      .addCase(loadCustomPackageDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCustomPackageError, resetCustomPackage } = customPackageSlice.actions;
// Aliases for compatibility
export const clearPackageError = clearCustomPackageError;
export const clearPackageState = resetCustomPackage;

export default customPackageSlice.reducer;
