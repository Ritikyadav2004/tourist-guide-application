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

const initialState = {
  loading: false,
  order: null,
  payment: null,
  history: [],
  error: null,
  success: false,
};

export const paymentReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_ORDER_REQUEST:
    case VERIFY_PAYMENT_REQUEST:
    case GET_PAYMENT_HISTORY_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case CREATE_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        order: action.payload,
        error: null,
      };

    case VERIFY_PAYMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        payment: action.payload,
        success: true,
        error: null,
      };

    case GET_PAYMENT_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        history: action.payload?.payments || [],
        error: null,
      };

    case CREATE_ORDER_FAIL:
    case VERIFY_PAYMENT_FAIL:
    case GET_PAYMENT_HISTORY_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false,
      };

    case CLEAR_PAYMENT_STATE:
      return {
        ...initialState,
      };

    case CLEAR_PAYMENT_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};