import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducers/authReducer";
import { postReducer } from "./reducers/postReducer";
import { uiReducer } from "./reducers/uiReducer";
import { itineraryReducer } from "./reducers/itineraryReducer";
import { chatReducer } from "./reducers/chatReducer";

// New RTK Reducers
import bookingReducer from "./slices/bookingSlice";
import paymentReducer from "./slices/paymentSlice";
import earningsReducer from "./slices/earningsSlice";
import customPackageReducer from "./slices/customPackageSlice";

const rawToken = localStorage.getItem("token");
const tokenFromStorage =
  rawToken && rawToken !== "undefined" && rawToken !== "null" ? rawToken : null;

const initialState = {
  auth: {
    token: tokenFromStorage || null,
    user: null,
    loading: false,
    error: null,
  },
  post: {
    posts: [],
    loading: false,
    error: null,
  },
  ui: {
    locationFilter: "",
  },
  booking: {
    loading: false,
    bookings: [],
    booking: null,
    guideAvailability: [],
    error: null,
    success: false,
  },
  customPackage: {
    loading: false,
    estimating: false,
    saving: false,
    estimate: null,
    package: null,
    booking: null,
    details: null,
    error: null,
    success: false,
  },
  payment: {
    loading: false,
    order: null,
    payment: null,
    history: [],
    error: null,
    success: false,
  },
  guide: {
    loading: false,
    earnings: null,
    bookingEarnings: null,
    error: null,
  },
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    post: postReducer,
    ui: uiReducer,
    itinerary: itineraryReducer,
    chat: chatReducer,
    booking: bookingReducer,
    payment: paymentReducer,
    guide: earningsReducer,
    customPackage: customPackageReducer,
  },
  preloadedState: initialState,
});

export default store;
