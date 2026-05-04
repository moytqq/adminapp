import { configureStore } from '@reduxjs/toolkit';
import treeReducer from './slices/treeSlice';
import authReducer from './slices/authSlice';
import personalReducer from './slices/personalSlice';
import addressReducer from './slices/addressSlice';
import { setStore } from './storeAccessor';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      tree: treeReducer,
      auth: authReducer,
      personal: personalReducer,
      address: addressReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

  setStore(store);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];