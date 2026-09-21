import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as paymentService from "../services/paymentService";

const initialState = {
  loading: false,
  order: null,
  payment: null,
  history: [],
  userPayments: null,
  guideAnalytics: null,
  adminAnalytics: null,
  error: null,
  success: false,
};

// Async Thunks
export const createOrderAction = createAsyncThunk(
  "payment/createOrder",
  async ({ bookingId, type }, { rejectWithValue }) => {
    try {
      return await paymentService.createPaymentOrder({ bookingId, type });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Alias
export const createPaymentOrderAction = createOrderAction;

export const verifyPaymentAction = createAsyncThunk(
  "payment/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      return await paymentService.verifyPayment(paymentData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getPaymentHistoryAction = createAsyncThunk(
  "payment/getHistory",
  async (_, { rejectWithValue }) => {
    try {
      const data = await paymentService.getPaymentHistory();
      return data.payments || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getUserPaymentsAction = createAsyncThunk(
  "payment/getUserPayments",
  async (_, { rejectWithValue }) => {
    try {
      return await paymentService.getUserPayments();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getGuideEarningsAnalyticsAction = createAsyncThunk(
  "payment/getGuideEarningsAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await paymentService.getGuideEarningsAnalytics();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAdminPaymentAnalyticsAction = createAsyncThunk(
  "payment/getAdminPaymentAnalytics",
  async (filters, { rejectWithValue }) => {
    try {
      return await paymentService.getAdminPaymentAnalytics(filters);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePaymentStatusAction = createAsyncThunk(
  "payment/updatePaymentStatus",
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      return await paymentService.updatePaymentStatus(paymentId, status);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentState: () => initialState,
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrderAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderAction.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
        state.error = null;
      })
      .addCase(createOrderAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify Payment
      .addCase(verifyPaymentAction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyPaymentAction.fulfilled, (state, action) => {
        state.loading = false;
        state.payment = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(verifyPaymentAction.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      // Get History
      .addCase(getPaymentHistoryAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentHistoryAction.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.error = null;
      })
      .addCase(getPaymentHistoryAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Payments (Tourist)
      .addCase(getUserPaymentsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPaymentsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.userPayments = action.payload.userPayments || action.payload;
        state.error = null;
      })
      .addCase(getUserPaymentsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Guide Earnings Analytics
      .addCase(getGuideEarningsAnalyticsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGuideEarningsAnalyticsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.guideAnalytics = action.payload.guideAnalytics || action.payload;
        state.error = null;
      })
      .addCase(getGuideEarningsAnalyticsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Admin Payment Analytics
      .addCase(getAdminPaymentAnalyticsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminPaymentAnalyticsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.adminAnalytics = action.payload.adminAnalytics || action.payload;
        state.error = null;
      })
      .addCase(getAdminPaymentAnalyticsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Payment Status (Admin)
      .addCase(updatePaymentStatusAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePaymentStatusAction.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update the local admin list with the updated record
        if (state.adminAnalytics && state.adminAnalytics.payments) {
          state.adminAnalytics.payments = state.adminAnalytics.payments.map((p) =>
            p._id === action.payload.payment._id ? { ...p, ...action.payload.payment } : p
          );
        }
        state.error = null;
      })
      .addCase(updatePaymentStatusAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState, clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
