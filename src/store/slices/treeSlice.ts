import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PersonItem, TreeItem, TreeState } from '@/types/tree.types';
import { fetchTreeDataFromApi } from '@/utils/treeHelpers';

const TREE_STORAGE_KEY = 'company-tree-data';

const getInitialState = (): TreeState => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem(TREE_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        return {
          items: parsedData,
          selectedItemId: null,
          loading: false,
          error: null,
        };
      } catch (error) {
        console.error('Error parsing saved tree data:', error);
      }
    }
  }

  return {
    items: [],
    selectedItemId: null,
    loading: false,
    error: null,
  };
};

const initialState: TreeState = getInitialState();

const saveTreeToLocalStorage = (items: TreeItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(items));
  }
};

const updateItemInTree = (items: TreeItem[], itemId: string, updates: Partial<TreeItem>): TreeItem[] => {
  return items.map(item => {
    if (item.id === itemId) {
      return { ...item, ...updates } as TreeItem;
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: updateItemInTree(item.children, itemId, updates),
      } as TreeItem;
    }
    return item;
  });
};

export const loadTreeData = createAsyncThunk(
  'tree/loadData',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const data = await fetchTreeDataFromApi();

      saveTreeToLocalStorage(data);

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
      saveTreeToLocalStorage(state.items);
    },

    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedItemId = action.payload;
    },

    updateItem: (state, action: PayloadAction<{ id: string; updates: Partial<TreeItem> }>) => {
      state.items = updateItemInTree(state.items, action.payload.id, action.payload.updates);
      saveTreeToLocalStorage(state.items);
    },

    refreshTreeData: (state, action: PayloadAction<TreeItem[]>) => {
      state.items = action.payload;
      saveTreeToLocalStorage(state.items);
    },

    updatePersonData: (state, action: PayloadAction<{
      id: string;
      data: Partial<PersonItem['data']>
    }>) => {
      const { id, data } = action.payload;

      const updatePersonInTree = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          if (item.id === id && item.type === 'Person') {
            const personItem = item as PersonItem;
            return {
              ...personItem,
              data: {
                ...personItem.data,
                ...data
              },
              label: data.firstName && data.lastName
                ? `${data.firstName} ${data.lastName}`
                : personItem.label,
              subLabel: data.position || personItem.subLabel
            } as PersonItem;
          }
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updatePersonInTree(item.children),
            } as TreeItem;
          }
          return item;
        });
      };

      state.items = updatePersonInTree(state.items);
      saveTreeToLocalStorage(state.items);
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
        saveTreeToLocalStorage(action.payload);
      })
      .addCase(loadTreeData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  toggleExpand,
  updatePersonData,
} = treeSlice.actions;
export default treeSlice.reducer;