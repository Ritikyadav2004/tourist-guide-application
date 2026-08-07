import {
  BOOKING_REQUEST,
  BOOKING_SUCCESS,
  BOOKING_FAIL,
  MY_BOOKINGS_REQUEST,
  MY_BOOKINGS_SUCCESS,
  MY_BOOKINGS_FAIL,
  BOOKING_DETAILS_REQUEST,
  BOOKING_DETAILS_SUCCESS,
  BOOKING_DETAILS_FAIL,
  CANCEL_BOOKING_REQUEST,
  CANCEL_BOOKING_SUCCESS,
  CANCEL_BOOKING_FAIL,
  UPDATE_BOOKING_STATUS_REQUEST,
  UPDATE_BOOKING_STATUS_SUCCESS,
  UPDATE_BOOKING_STATUS_FAIL,
  GUIDE_AVAILABILITY_REQUEST,
  GUIDE_AVAILABILITY_SUCCESS,
  GUIDE_AVAILABILITY_FAIL,
  CLEAR_BOOKING_ERROR,
} from "../constants/bookingConstants";
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
  updateBookingStatus,
  getGuideAvailability,
} from "../services/api";

// Create Booking
export const createNewBooking = (bookingData) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_REQUEST });
    const data = await createBooking(bookingData);
    dispatch({ type: BOOKING_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: BOOKING_FAIL, payload: error.message });
    throw error;
  }
};

// Get My Bookings
export const getMyBookingsAction = () => async (dispatch) => {
  try {
    dispatch({ type: MY_BOOKINGS_REQUEST });
    const data = await getMyBookings();
    dispatch({ type: MY_BOOKINGS_SUCCESS, payload: data.bookings || data });
  } catch (error) {
    dispatch({ type: MY_BOOKINGS_FAIL, payload: error.message });
  }
};

// Get Booking Details
export const getBookingDetailsAction = (bookingId) => async (dispatch) => {
  try {
    dispatch({ type: BOOKING_DETAILS_REQUEST });
    const data = await getBookingDetails(bookingId);
    dispatch({ type: BOOKING_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: BOOKING_DETAILS_FAIL, payload: error.message });
  }
};

// Cancel Booking
export const cancelBookingAction = (bookingId) => async (dispatch) => {
  try {
    dispatch({ type: CANCEL_BOOKING_REQUEST });
    const data = await cancelBooking(bookingId);
    dispatch({ type: CANCEL_BOOKING_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: CANCEL_BOOKING_FAIL, payload: error.message });
    throw error;
  }
};

// Update Booking Status
export const updateBookingStatusAction = (bookingId, status) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_BOOKING_STATUS_REQUEST });
    const data = await updateBookingStatus(bookingId, status);
    dispatch({ type: UPDATE_BOOKING_STATUS_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: UPDATE_BOOKING_STATUS_FAIL, payload: error.message });
    throw error;
  }
};

// Get Guide Availability
export const getGuideAvailabilityAction = (guideId, dateRange) => async (dispatch) => {
  try {
    dispatch({ type: GUIDE_AVAILABILITY_REQUEST });
    const data = await getGuideAvailability(guideId, dateRange);
    dispatch({ type: GUIDE_AVAILABILITY_SUCCESS, payload: data.availability || data });
  } catch (error) {
    dispatch({ type: GUIDE_AVAILABILITY_FAIL, payload: error.message });
  }
};

// Clear Booking Error
export const clearBookingError = () => (dispatch) => {
  dispatch({ type: CLEAR_BOOKING_ERROR });
};
