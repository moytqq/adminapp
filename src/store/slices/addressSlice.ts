import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { treeApi } from '@/services/api';
import { ApiTreeItem } from '@/types/tree.types';

interface AddressState {
  stores: Array<{ id: string; name: string; hid: string; address?: string }>;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: AddressState = {
  stores: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const CACHE_DURATION = 5 * 60 * 1000;

export const loadStores = createAsyncThunk(
  'address/loadStores',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { address: AddressState };

      if (state.address.lastFetched &&
        Date.now() - state.address.lastFetched < CACHE_DURATION &&
        state.address.stores.length > 0) {
        return state.address.stores;
      }

      const addressData = await treeApi.getAddressTree();

      const storeItems = addressData.filter(item => item.type === 'Store');

      const storeList = storeItems.map(item => {
        const match = item.id.toString().match(/\d+$/);
        const hid = match ? match[0] : item.id.toString();

        const address = addressData.find(a => a.id === item.parent_id);

        return {
          id: item.id.toString(),
          name: item.name,
          hid: hid,
          address: address?.description || address?.name || ''
        };
      });

      storeList.sort((a, b) => a.name.localeCompare(b.name));

      return storeList;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки магазинов');
    }
  }
);

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressCache: (state) => {
      state.stores = [];
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(loadStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAddressCache } = addressSlice.actions;
export default addressSlice.reducer;