import {
  GUIDE_EARNINGS_REQUEST,
  GUIDE_EARNINGS_SUCCESS,
  GUIDE_EARNINGS_FAIL,
  GUIDE_BOOKING_EARNINGS_REQUEST,
  GUIDE_BOOKING_EARNINGS_SUCCESS,
  GUIDE_BOOKING_EARNINGS_FAIL,
  CLEAR_GUIDE_ERROR,
} from "../constants/guideConstants";
import { getGuideEarnings, getGuideBookingEarnings } from "../services/api";

// ============================================
// GET GUIDE EARNINGS (Dashboard Stats)
// ============================================
export const getGuideEarningsAction = () => async (dispatch) => {
  try {
    dispatch({ type: GUIDE_EARNINGS_REQUEST });

    const data = await getGuideEarnings();

    dispatch({
      type: GUIDE_EARNINGS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: GUIDE_EARNINGS_FAIL,
      payload: error?.message || "Unable to fetch earnings.",
    });
  }
};

// ============================================
// GET GUIDE BOOKING EARNINGS (Detailed per booking)
// ============================================
export const getGuideBookingEarningsAction = (page = 1, limit = 10) => async (dispatch) => {
  try {
    dispatch({ type: GUIDE_BOOKING_EARNINGS_REQUEST });

    const data = await getGuideBookingEarnings(page, limit);

    dispatch({
      type: GUIDE_BOOKING_EARNINGS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: GUIDE_BOOKING_EARNINGS_FAIL,
      payload: error?.message || "Unable to fetch booking earnings.",
    });
  }
};

// ============================================
// CLEAR ERROR
// ============================================
export const clearGuideError = () => (dispatch) => {
  dispatch({ type: CLEAR_GUIDE_ERROR });
};