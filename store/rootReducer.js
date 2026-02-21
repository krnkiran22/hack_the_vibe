import { combineReducers } from "@reduxjs/toolkit";
import authslice from "./authslice";

const rootReducer = combineReducers({
  authslice,
});

export default rootReducer;
