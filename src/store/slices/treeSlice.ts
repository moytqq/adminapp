import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TreeItem, TreeState } from '@/types/tree.types';
import { fetchTreeDataFromApi } from '@/utils/treeHelpers';

const initialState: TreeState = {
  items: [],
  selectedItemId: null,
  loading: false,
  error: null,
};

export const loadTreeData = createAsyncThunk(
  'tree/loadData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchTreeDataFromApi();
      return data;
    } catch (error: any) {
      console.error('Error in loadTreeData:', error);
      return rejectWithValue(error.message || 'Failed to load data from API');
    }
  },
);

const treeSlice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    toggleExpand: (state, action: PayloadAction<string>) => {
      const toggleItem = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          if (item.id === action.payload) {
            return { ...item, isExpanded: !item.isExpanded } as TreeItem;
          }
          if (item.children) {
            return {
              ...item,
              children: toggleItem(item.children),
            } as TreeItem;
          }
          return item;
        });
      };
      state.items = toggleItem(state.items);
    },
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItemId = action.payload;
    },
    updateItem: (state, action: PayloadAction<{ id: string; updates: Partial<TreeItem> }>) => {
      const updateItemInTree = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          if (item.id === action.payload.id) {
            return { ...item, ...action.payload.updates } as TreeItem;
          }
          if (item.children) {
            return {
              ...item,
              children: updateItemInTree(item.children),
            } as TreeItem;
          }
          return item;
        });
      };
      state.items = updateItemInTree(state.items);
    },

    refreshTreeData: (state, action: PayloadAction<TreeItem[]>) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTreeData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTreeData.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(loadTreeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // state.items = [];
      });
  },
});

export const {
  toggleExpand,
} = treeSlice.actions;
export default treeSlice.reducer;