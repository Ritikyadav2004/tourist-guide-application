import {
  GUIDE_EARNINGS_REQUEST,
  GUIDE_EARNINGS_SUCCESS,
  GUIDE_EARNINGS_FAIL,
  GUIDE_BOOKING_EARNINGS_REQUEST,
  GUIDE_BOOKING_EARNINGS_SUCCESS,
  GUIDE_BOOKING_EARNINGS_FAIL,
  CLEAR_GUIDE_ERROR,
} from "../constants/guideConstants";

const initialState = {
  loading: false,
  earnings: null,
  bookingEarnings: null,
  error: null,
};

export const guideReducer = (state = initialState, action) => {
  switch (action.type) {
    case GUIDE_EARNINGS_REQUEST:
    case GUIDE_BOOKING_EARNINGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GUIDE_EARNINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        earnings: action.payload,
        error: null,
      };

    case GUIDE_BOOKING_EARNINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        bookingEarnings: action.payload,
        error: null,
      };

    case GUIDE_EARNINGS_FAIL:
    case GUIDE_BOOKING_EARNINGS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CLEAR_GUIDE_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};