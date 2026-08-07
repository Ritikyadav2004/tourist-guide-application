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

const initialState = {
  loading: false,
  bookings: [],
  booking: null,
  guideAvailability: [],
  error: null,
  success: false,
};

export const bookingReducer = (state = initialState, action) => {
  switch (action.type) {
    case BOOKING_REQUEST:
    case MY_BOOKINGS_REQUEST:
    case BOOKING_DETAILS_REQUEST:
    case CANCEL_BOOKING_REQUEST:
    case UPDATE_BOOKING_STATUS_REQUEST:
    case GUIDE_AVAILABILITY_REQUEST:
      return { ...state, loading: true, error: null, success: false };

    case BOOKING_SUCCESS:
    case CANCEL_BOOKING_SUCCESS:
    case UPDATE_BOOKING_STATUS_SUCCESS:
      return { ...state, loading: false, success: true, error: null };

    case MY_BOOKINGS_SUCCESS:
      return { ...state, loading: false, bookings: action.payload, error: null };

    case BOOKING_DETAILS_SUCCESS:
      return { ...state, loading: false, booking: action.payload, error: null };

    case GUIDE_AVAILABILITY_SUCCESS:
      return { ...state, loading: false, guideAvailability: action.payload, error: null };

    case BOOKING_FAIL:
    case MY_BOOKINGS_FAIL:
    case BOOKING_DETAILS_FAIL:
    case CANCEL_BOOKING_FAIL:
    case UPDATE_BOOKING_STATUS_FAIL:
    case GUIDE_AVAILABILITY_FAIL:
      return { ...state, loading: false, error: action.payload, success: false };

    case CLEAR_BOOKING_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
