import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { treeApi } from '@/services/api';
import { ApiTreeItem } from '@/types/tree.types';
import { createStoreItem } from '@/utils/addressTransformer';

interface StoreOption {
  id: string;
  name: string;
  hid: string;
  address?: string;
  formattedName: string;
}

interface AddressState {
  stores: StoreOption[];
  rawAddressData: ApiTreeItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: AddressState = {
  stores: [],
  rawAddressData: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// 5 минут кэширования
const CACHE_DURATION = 5 * 60 * 1000;

export const loadStores = createAsyncThunk(
  'address/loadStores',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { address: AddressState };

      // Проверяем кэш
      if (state.address.lastFetched &&
        Date.now() - state.address.lastFetched < CACHE_DURATION &&
        state.address.stores.length > 0) {
        return { stores: state.address.stores, rawData: state.address.rawAddressData };
      }

      const addressData = await treeApi.getAddressTree();

      const addressMap = new Map<number, ApiTreeItem>();
      addressData.forEach(item => {
        if (item.type === 'Address') {
          addressMap.set(item.id, item);
        }
      });

      const storeItems = addressData.filter(item => item.type === 'Store');

      const storeList: StoreOption[] = storeItems.map(store => {
        const match = store.id.toString().match(/\d+$/);
        const hid = match ? match[0] : store.id.toString();
        const address = addressMap.get(store.parent_id);

        const storeItem = createStoreItem(store, store.parent_id);

        return {
          id: store.id.toString(),
          name: store.name,
          hid: hid,
          address: address?.description || address?.name || '',
          formattedName: storeItem.data.description || storeItem.label,
        };
      });

      storeList.sort((a, b) => a.formattedName.localeCompare(b.formattedName));

      return { stores: storeList, rawData: addressData };
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
      state.rawAddressData = [];
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
        state.stores = action.payload.stores;
        state.rawAddressData = action.payload.rawData;
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