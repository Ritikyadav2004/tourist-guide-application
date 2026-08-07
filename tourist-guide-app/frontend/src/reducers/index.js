import { combineReducers } from "redux";
import { authReducer } from "./authReducer";
import { postReducer } from "./postReducer";
import { uiReducer } from "./uiReducer";
import { bookingReducer } from "./bookingReducer";
import { itineraryReducer } from "./itineraryReducer";
import { chatReducer } from "./chatReducer";
import { paymentReducer } from "./paymentReducer";
import { guideReducer } from "./guideReducer";
import { customPackageReducer } from "./customPackageReducer";

const rootReducer = combineReducers({
  auth: authReducer,
  post: postReducer,
  ui: uiReducer,
  booking: bookingReducer,
  itinerary: itineraryReducer,
  chat: chatReducer,
  payment: paymentReducer,
  guide: guideReducer,
  customPackage: customPackageReducer,
});

export default rootReducer;
