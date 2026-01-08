import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TreeItem, TreeState } from '@/types/tree.types';
import { fetchTreeData, toggleItemExpanded } from '@/utils/treeHelpers';

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
      // В реальном приложении здесь будет API вызов
      return await fetchTreeData();
    } catch (error) {
      return rejectWithValue('Failed to load data');
    }
  }
);

const treeSlice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    toggleExpand: (state, action: PayloadAction<string>) => {
      state.items = toggleItemExpanded(state.items, action.payload);
    },
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItemId = action.payload;
    },
    addItem: (state, action: PayloadAction<{ parentId: string; label: string }>) => {
      // Логика добавления нового элемента
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      // Логика удаления элемента
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
      })
      .addCase(loadTreeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { toggleExpand, selectItem, addItem, deleteItem } = treeSlice.actions;
export default treeSlice.reducer;