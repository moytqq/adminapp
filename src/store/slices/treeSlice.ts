import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PersonItem, StoreItem, TreeItem, TreeItemType, TreeState, TreeViewMode } from '@/types/tree.types';
import { fetchMockTreeData, fetchTreeDataFromApi } from '@/utils/treeHelpers';
import { treeApi } from '@/services/api';
import { buildTreeFromApiData, enhanceTreeDataWithMockInfo } from '@/utils/apiTransformers';
import { transformTreeDataByViewMode } from '@/utils/storeDepartmentTransformer';

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
          viewMode: 'hierarchy',
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
    viewMode: 'hierarchy',
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
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as { tree: TreeState };
      const viewMode = state.tree.viewMode;

      console.log('Loading tree data with viewMode:', viewMode);

      const apiData = await treeApi.getHierarchyTree();

      let treeData = buildTreeFromApiData(apiData);
      treeData = enhanceTreeDataWithMockInfo(treeData);

      if (viewMode === 'store-departments') {
        treeData = transformTreeDataByViewMode(apiData, treeData, viewMode);
      }

      console.log('Tree data loaded:', treeData);
      saveTreeToLocalStorage(treeData);
      return treeData;
    } catch (error: any) {
      console.error('Error in loadTreeData:', error);

      const state = getState() as { tree: TreeState };
      const viewMode = state.tree.viewMode;
      const mockData = await fetchMockTreeData(viewMode);
      return mockData;
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

    setViewMode: (state, action: PayloadAction<TreeViewMode>) => {
      state.viewMode = action.payload;
    },

    switchViewMode: (state, action: PayloadAction<TreeViewMode>) => {
      state.viewMode = action.payload;
      const resetExpanded = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          const newItem = { ...item, isExpanded: action.payload === 'store-departments' };
          if (item.children && item.children.length > 0) {
            newItem.children = resetExpanded(item.children);
          }
          return newItem;
        });
      };
      state.items = resetExpanded(state.items);
    },

    updateStoreData: (state, action: PayloadAction<{
      id: string;
      data: Partial<StoreItem['data']>
    }>) => {
      const { id, data } = action.payload;

      const updateStoreInTree = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          if (item.id === id && item.type === TreeItemType.STORE) {
            const storeItem = item as StoreItem;
            return {
              ...storeItem,
              data: {
                ...storeItem.data,
                ...data
              },
              label: data.storeName || storeItem.label,
            } as StoreItem;
          }
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateStoreInTree(item.children),
            } as TreeItem;
          }
          return item;
        });
      };

      state.items = updateStoreInTree(state.items);
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
  switchViewMode,
  updateItem
} = treeSlice.actions;
export default treeSlice.reducer;