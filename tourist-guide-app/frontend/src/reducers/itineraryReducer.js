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

const initialState = {
  loading: false,
  itineraries: [],
  itinerary: null,
  error: null,
  success: false,
  shareCode: null,
};

export const itineraryReducer = (state = initialState, action) => {
  switch (action.type) {
    case ITINERARY_REQUEST:
    case MY_ITINERARIES_REQUEST:
    case ITINERARY_DETAILS_REQUEST:
    case ADD_ACTIVITY_REQUEST:
    case UPDATE_ACTIVITY_REQUEST:
    case REMOVE_ACTIVITY_REQUEST:
    case DELETE_ITINERARY_REQUEST:
    case SHARE_ITINERARY_REQUEST:
      return { ...state, loading: true, error: null, success: false };

    case ITINERARY_SUCCESS:
    case ADD_ACTIVITY_SUCCESS:
    case UPDATE_ACTIVITY_SUCCESS:
    case REMOVE_ACTIVITY_SUCCESS:
    case DELETE_ITINERARY_SUCCESS:
      return { ...state, loading: false, success: true, error: null };

    case MY_ITINERARIES_SUCCESS:
      return { ...state, loading: false, itineraries: action.payload, error: null };

    case ITINERARY_DETAILS_SUCCESS:
      return { ...state, loading: false, itinerary: action.payload, error: null };

    case SHARE_ITINERARY_SUCCESS:
      return { ...state, loading: false, success: true, shareCode: action.payload.shareCode, error: null };

    case ITINERARY_FAIL:
    case MY_ITINERARIES_FAIL:
    case ITINERARY_DETAILS_FAIL:
    case ADD_ACTIVITY_FAIL:
    case UPDATE_ACTIVITY_FAIL:
    case REMOVE_ACTIVITY_FAIL:
    case DELETE_ITINERARY_FAIL:
    case SHARE_ITINERARY_FAIL:
      return { ...state, loading: false, error: action.payload, success: false };

    case CLEAR_ITINERARY_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
