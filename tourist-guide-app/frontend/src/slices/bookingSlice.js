import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as bookingService from "../services/bookingService";

const initialState = {
  loading: false,
  bookings: [],
  booking: null,
  guideAvailability: [],
  error: null,
  success: false,
};

// Async Thunks
export const createNewBooking = createAsyncThunk(
  "booking/createNewBooking",
  async (bookingData, { rejectWithValue }) => {
    try {
      return await bookingService.createBooking(bookingData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMyBookingsAction = createAsyncThunk(
  "booking/getMyBookings",
  async (_, { rejectWithValue }) => {
    try {
      const data = await bookingService.getMyBookings();
      return data.bookings || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getBookingDetailsAction = createAsyncThunk(
  "booking/getBookingDetails",
  async (bookingId, { rejectWithValue }) => {
    try {
      const data = await bookingService.getBookingDetails(bookingId);
      return data.booking || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelBookingAction = createAsyncThunk(
  "booking/cancelBooking",
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      return await bookingService.cancelBooking(bookingId, reason);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBookingStatusAction = createAsyncThunk(
  "booking/updateBookingStatus",
  async ({ bookingId, status, otp, cancellationReason }, { rejectWithValue }) => {
    try {
      return await bookingService.updateBookingStatus(bookingId, {
        status,
        otp,
        cancellationReason,
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getGuideAvailabilityAction = createAsyncThunk(
  "booking/getGuideAvailability",
  async ({ guideId, from, to }, { rejectWithValue }) => {
    try {
      const data = await bookingService.getGuideAvailability(guideId, { from, to });
      return data.availability || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    resetBookingState: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Booking
      .addCase(createNewBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createNewBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.booking = action.payload.booking || action.payload;
        state.error = null;
      })
      .addCase(createNewBooking.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      // Get My Bookings
      .addCase(getMyBookingsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyBookingsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(getMyBookingsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Booking Details
      .addCase(getBookingDetailsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingDetailsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload;
        state.error = null;
      })
      .addCase(getBookingDetailsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel Booking
      .addCase(cancelBookingAction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(cancelBookingAction.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(cancelBookingAction.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      // Update Booking Status
      .addCase(updateBookingStatusAction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateBookingStatusAction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        if (action.payload?.booking) {
          state.booking = action.payload.booking;
        }
      })
      .addCase(updateBookingStatusAction.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      // Get Guide Availability
      .addCase(getGuideAvailabilityAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGuideAvailabilityAction.fulfilled, (state, action) => {
        state.loading = false;
        state.guideAvailability = action.payload;
        state.error = null;
      })
      .addCase(getGuideAvailabilityAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBookingError, resetBookingState } = bookingSlice.actions;
export default bookingSlice.reducer;
