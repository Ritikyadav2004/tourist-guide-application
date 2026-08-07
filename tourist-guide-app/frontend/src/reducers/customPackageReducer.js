import {
  CUSTOM_PACKAGE_CLEAR_ERROR,
  CUSTOM_PACKAGE_DETAILS_FAIL,
  CUSTOM_PACKAGE_DETAILS_REQUEST,
  CUSTOM_PACKAGE_DETAILS_SUCCESS,
  CUSTOM_PACKAGE_ESTIMATE_FAIL,
  CUSTOM_PACKAGE_ESTIMATE_REQUEST,
  CUSTOM_PACKAGE_ESTIMATE_SUCCESS,
  CUSTOM_PACKAGE_RESET,
  CUSTOM_PACKAGE_SAVE_FAIL,
  CUSTOM_PACKAGE_SAVE_REQUEST,
  CUSTOM_PACKAGE_SAVE_SUCCESS,
} from "../constants/customPackageConstants";

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

export const customPackageReducer = (state = initialState, action) => {
  switch (action.type) {
    case CUSTOM_PACKAGE_ESTIMATE_REQUEST:
      return { ...state, estimating: true, error: null };
    case CUSTOM_PACKAGE_SAVE_REQUEST:
      return { ...state, saving: true, error: null };
    case CUSTOM_PACKAGE_DETAILS_REQUEST:
      return { ...state, loading: true, error: null };

    case CUSTOM_PACKAGE_ESTIMATE_SUCCESS:
      return {
        ...state,
        estimating: false,
        estimate: action.payload?.estimate || action.payload,
        error: null,
      };

    case CUSTOM_PACKAGE_SAVE_SUCCESS:
      return {
        ...state,
        saving: false,
        package: action.payload?.package || null,
        booking: action.payload?.booking || null,
        success: true,
        error: null,
      };

    case CUSTOM_PACKAGE_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        details: action.payload?.package || action.payload,
        error: null,
      };

    case CUSTOM_PACKAGE_ESTIMATE_FAIL:
      return { ...state, estimating: false, error: action.payload };
    case CUSTOM_PACKAGE_SAVE_FAIL:
      return { ...state, saving: false, error: action.payload, success: false };
    case CUSTOM_PACKAGE_DETAILS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case CUSTOM_PACKAGE_CLEAR_ERROR:
      return { ...state, error: null };
    case CUSTOM_PACKAGE_RESET:
      return initialState;
    default:
      return state;
  }
};
