import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as earningsService from "../services/earningsService";

const initialState = {
  loading: false,
  earnings: null,
  bookingEarnings: null,
  error: null,
};

// Async Thunks
export const getGuideEarningsAction = createAsyncThunk(
  "earnings/getGuideEarnings",
  async (_, { rejectWithValue }) => {
    try {
      return await earningsService.getGuideEarnings();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getGuideBookingEarningsAction = createAsyncThunk(
  "earnings/getGuideBookingEarnings",
  async ({ page, limit } = { page: 1, limit: 20 }, { rejectWithValue }) => {
    try {
      return await earningsService.getGuideBookingEarnings(page, limit);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const earningsSlice = createSlice({
  name: "earnings",
  initialState,
  reducers: {
    clearGuideError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Guide Earnings Dashboard
      .addCase(getGuideEarningsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGuideEarningsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.earnings = action.payload;
        state.error = null;
      })
      .addCase(getGuideEarningsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Guide Booking Earnings Breakdown
      .addCase(getGuideBookingEarningsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGuideBookingEarningsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingEarnings = action.payload;
        state.error = null;
      })
      .addCase(getGuideBookingEarningsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearGuideError } = earningsSlice.actions;
export default earningsSlice.reducer;
