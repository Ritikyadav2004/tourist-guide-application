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
import { estimatePackage, getPackageDetails, savePackage } from "../services/api";

export const estimateCustomPackage = (payload) => async (dispatch) => {
  try {
    dispatch({ type: CUSTOM_PACKAGE_ESTIMATE_REQUEST });
    const data = await estimatePackage(payload);
    dispatch({ type: CUSTOM_PACKAGE_ESTIMATE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({
      type: CUSTOM_PACKAGE_ESTIMATE_FAIL,
      payload: error?.message || "Unable to calculate package estimate.",
    });
    throw error;
  }
};

export const saveCustomPackage = (payload) => async (dispatch) => {
  try {
    dispatch({ type: CUSTOM_PACKAGE_SAVE_REQUEST });
    const data = await savePackage(payload);
    dispatch({ type: CUSTOM_PACKAGE_SAVE_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({
      type: CUSTOM_PACKAGE_SAVE_FAIL,
      payload: error?.message || "Unable to save custom package.",
    });
    throw error;
  }
};

export const loadCustomPackageDetails = (packageId) => async (dispatch) => {
  try {
    dispatch({ type: CUSTOM_PACKAGE_DETAILS_REQUEST });
    const data = await getPackageDetails(packageId);
    dispatch({ type: CUSTOM_PACKAGE_DETAILS_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({
      type: CUSTOM_PACKAGE_DETAILS_FAIL,
      payload: error?.message || "Unable to load custom package.",
    });
    throw error;
  }
};

export const clearCustomPackageError = () => ({ type: CUSTOM_PACKAGE_CLEAR_ERROR });
export const resetCustomPackage = () => ({ type: CUSTOM_PACKAGE_RESET });
// Aliases for backwards compatibility
export const clearPackageError = clearCustomPackageError;
export const clearPackageState = resetCustomPackage;
