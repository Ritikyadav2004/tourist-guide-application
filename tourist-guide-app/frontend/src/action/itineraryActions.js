import {
  ITINERARY_REQUEST,
  ITINERARY_SUCCESS,
  ITINERARY_FAIL,
  MY_ITINERARIES_REQUEST,
  MY_ITINERARIES_SUCCESS,
  MY_ITINERARIES_FAIL,
  ITINERARY_DETAILS_REQUEST,
  ITINERARY_DETAILS_SUCCESS,
  ITINERARY_DETAILS_FAIL,
  ADD_ACTIVITY_REQUEST,
  ADD_ACTIVITY_SUCCESS,
  ADD_ACTIVITY_FAIL,
  UPDATE_ACTIVITY_REQUEST,
  UPDATE_ACTIVITY_SUCCESS,
  UPDATE_ACTIVITY_FAIL,
  REMOVE_ACTIVITY_REQUEST,
  REMOVE_ACTIVITY_SUCCESS,
  REMOVE_ACTIVITY_FAIL,
  DELETE_ITINERARY_REQUEST,
  DELETE_ITINERARY_SUCCESS,
  DELETE_ITINERARY_FAIL,
  SHARE_ITINERARY_REQUEST,
  SHARE_ITINERARY_SUCCESS,
  SHARE_ITINERARY_FAIL,
  CLEAR_ITINERARY_ERROR,
} from "../constants/itineraryConstants";
import {
  createItinerary,
  getMyItineraries,
  getItinerary,
  addPostToItinerary,
  updateItineraryActivity,
  removeItineraryActivity,
  deleteItinerary,
  shareItinerary,
} from "../services/api";

// Create Itinerary
export const createNewItinerary = (itineraryData) => async (dispatch) => {
  try {
    dispatch({ type: ITINERARY_REQUEST });
    const data = await createItinerary(itineraryData);
    dispatch({ type: ITINERARY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: ITINERARY_FAIL, payload: error.message });
    throw error;
  }
};

// Get My Itineraries
export const getMyItinerariesAction = () => async (dispatch) => {
  try {
    dispatch({ type: MY_ITINERARIES_REQUEST });
    const data = await getMyItineraries();
    dispatch({ type: MY_ITINERARIES_SUCCESS, payload: data.itineraries || data });
  } catch (error) {
    dispatch({ type: MY_ITINERARIES_FAIL, payload: error.message });
  }
};

// Get Itinerary Details
export const getItineraryDetailsAction = (itineraryId) => async (dispatch) => {
  try {
    dispatch({ type: ITINERARY_DETAILS_REQUEST });
    const data = await getItinerary(itineraryId);
    dispatch({ type: ITINERARY_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: ITINERARY_DETAILS_FAIL, payload: error.message });
  }
};

// Add Activity to Itinerary
export const addActivityAction = (itineraryId, activityData) => async (dispatch) => {
  try {
    dispatch({ type: ADD_ACTIVITY_REQUEST });
    const data = await addPostToItinerary(itineraryId, activityData);
    dispatch({ type: ADD_ACTIVITY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: ADD_ACTIVITY_FAIL, payload: error.message });
    throw error;
  }
};

// Update Activity
export const updateActivityAction = (itineraryId, activityId, payload) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_ACTIVITY_REQUEST });
    const data = await updateItineraryActivity(itineraryId, activityId, payload);
    dispatch({ type: UPDATE_ACTIVITY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: UPDATE_ACTIVITY_FAIL, payload: error.message });
    throw error;
  }
};

// Remove Activity
export const removeActivityAction = (itineraryId, activityId) => async (dispatch) => {
  try {
    dispatch({ type: REMOVE_ACTIVITY_REQUEST });
    const data = await removeItineraryActivity(itineraryId, activityId);
    dispatch({ type: REMOVE_ACTIVITY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: REMOVE_ACTIVITY_FAIL, payload: error.message });
    throw error;
  }
};

// Delete Itinerary
export const deleteItineraryAction = (itineraryId) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_ITINERARY_REQUEST });
    const data = await deleteItinerary(itineraryId);
    dispatch({ type: DELETE_ITINERARY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: DELETE_ITINERARY_FAIL, payload: error.message });
    throw error;
  }
};

// Share Itinerary
export const shareItineraryAction = (itineraryId) => async (dispatch) => {
  try {
    dispatch({ type: SHARE_ITINERARY_REQUEST });
    const data = await shareItinerary(itineraryId);
    dispatch({ type: SHARE_ITINERARY_SUCCESS, payload: data });
    return data;
  } catch (error) {
    dispatch({ type: SHARE_ITINERARY_FAIL, payload: error.message });
    throw error;
  }
};

// Clear Itinerary Error
export const clearItineraryError = () => (dispatch) => {
  dispatch({ type: CLEAR_ITINERARY_ERROR });
};
