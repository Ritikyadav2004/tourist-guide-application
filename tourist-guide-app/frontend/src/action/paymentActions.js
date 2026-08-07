import {
  CREATE_ORDER_REQUEST,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAIL,
  VERIFY_PAYMENT_REQUEST,
  VERIFY_PAYMENT_SUCCESS,
  VERIFY_PAYMENT_FAIL,
  GET_PAYMENT_HISTORY_REQUEST,
  GET_PAYMENT_HISTORY_SUCCESS,
  GET_PAYMENT_HISTORY_FAIL,
  CLEAR_PAYMENT_STATE,
  CLEAR_PAYMENT_ERROR,
} from "../constants/paymentConstants";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
} from "../services/api";

// ============================================
// CREATE PAYMENT ORDER
// ============================================
export const createOrderAction = (bookingId, type = "deposit") => async (dispatch) => {
  try {
    dispatch({ type: CREATE_ORDER_REQUEST });

    console.log("[paymentActions:createOrderAction]", { bookingId, type });

    const data = await createPaymentOrder({ bookingId, type });

    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: error?.message || "Unable to create payment order.",
    });
    throw error;
  }
};

export const createPaymentOrderAction = ({ bookingId, type = "deposit" }) =>
  createOrderAction(bookingId, type);

// ============================================
// VERIFY PAYMENT
// ============================================
export const verifyPaymentAction = (paymentData) => async (dispatch) => {
  try {
    dispatch({ type: VERIFY_PAYMENT_REQUEST });

    const data = await verifyPayment(paymentData);

    dispatch({
      type: VERIFY_PAYMENT_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: VERIFY_PAYMENT_FAIL,
      payload: error?.message || "Payment verification failed.",
    });
    throw error;
  }
};

// ============================================
// GET PAYMENT HISTORY
// ============================================
export const getPaymentHistoryAction = () => async (dispatch) => {
  try {
    dispatch({ type: GET_PAYMENT_HISTORY_REQUEST });

    const data = await getPaymentHistory();

    dispatch({
      type: GET_PAYMENT_HISTORY_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: GET_PAYMENT_HISTORY_FAIL,
      payload: error?.message || "Unable to fetch payment history.",
    });
    throw error;
  }
};

// ============================================
// CLEAR STATES
// ============================================
export const clearPaymentState = () => (dispatch) => {
  dispatch({ type: CLEAR_PAYMENT_STATE });
};

export const clearPaymentError = () => (dispatch) => {
  dispatch({ type: CLEAR_PAYMENT_ERROR });
};
