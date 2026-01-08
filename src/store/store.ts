import { configureStore } from '@reduxjs/toolkit';
import treeReducer from './slices/treeSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      tree: treeReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];