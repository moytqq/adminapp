import { Store } from '@reduxjs/toolkit';
import { RootState } from './store';

let store: Store<RootState> | null = null;

export const setStore = (s: Store<RootState>) => {
  store = s;
};

export const getStore = (): Store<RootState> | null => {
  return store;
};