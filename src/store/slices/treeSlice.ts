// store/slices/treeSlice.ts (обновленная версия)

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ApiTreeItem,
  PersonItem,
  StoreItem,
  TreeItem,
  TreeItemType,
  TreeState,
  TreeViewMode,
} from '@/types/tree.types';
import { fetchMockTreeData, transformTreeDataByViewMode } from '@/utils/treeHelpers';
import { treeApi } from '@/services/api';
import { buildTreeFromApiData, enhanceTreeDataWithMockInfo, filterOnlyDepartments } from '@/utils/apiTransformers';

const TREE_STORAGE_KEY = 'company-tree-data';
const ORIGINAL_API_DATA_KEY = 'company-original-api-data';

const saveTreeToLocalStorage = (items: TreeItem[]) => {
};

const saveOriginalApiData = (apiData: ApiTreeItem[] | null) => {
};

const loadOriginalApiData = (): ApiTreeItem[] | null => {
  return null;
};

const getInitialState = (): TreeState => {
  return {
    items: [],
    originalApiData: null,
    selectedItemId: null,
    loading: false,
    error: null,
    viewMode: 'hierarchy',
  };
};

const initialState: TreeState = getInitialState();

export const loadTreeData = createAsyncThunk(
  'tree/loadData',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as { tree: TreeState };
      const viewMode = state.tree.viewMode;

      console.log('Loading tree data with viewMode:', viewMode);

      let apiData: ApiTreeItem[];

      switch (viewMode) {
        case 'addresses':
          apiData = await treeApi.getAddressTree();
          break;
        case 'hierarchy':
        case 'store-departments':
        default:
          apiData = await treeApi.getHierarchyTree();
          break;
      }

      // Для режима иерархии оставляем только департаменты
      let treeData: TreeItem[];
      if (viewMode === 'hierarchy') {
        // Фильтруем API данные, оставляя только департаменты и их родителей
        const filteredApiData = filterOnlyDepartments(apiData);
        treeData = buildTreeFromApiData(filteredApiData);
        treeData = enhanceTreeDataWithMockInfo(treeData);
      } else {
        treeData = buildTreeFromApiData(apiData);
        if (viewMode === 'store-departments' || viewMode === 'addresses') {
          treeData = transformTreeDataByViewMode(apiData, treeData, viewMode);
        } else {
          treeData = enhanceTreeDataWithMockInfo(treeData);
        }
      }

      console.log('Built new tree data for viewMode:', viewMode);

      return {
        items: treeData,
        originalApiData: apiData,
      };
    } catch (error: any) {
      console.error('Error in loadTreeData:', error);

      const state = getState() as { tree: TreeState };
      const viewMode = state.tree.viewMode;
      const mockData = await fetchMockTreeData(viewMode);

      return {
        items: mockData,
        originalApiData: null,
      };
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
      const { id, updates } = action.payload;

      const updateItemInTree = (items: TreeItem[]): TreeItem[] => {
        return items.map(item => {
          if (item.id === id) {
            if (item.type === TreeItemType.STORE && updates.data) {
              const storeItem = item as StoreItem;
              return {
                ...storeItem,
                ...updates,
                data: {
                  ...storeItem.data,
                  ...updates.data,
                },
              } as StoreItem;
            }
            if (item.type === TreeItemType.PERSON && updates.data) {
              const personItem = item as PersonItem;
              return {
                ...personItem,
                ...updates,
                data: {
                  ...personItem.data,
                  ...updates.data,
                },
              } as PersonItem;
            }
            return { ...item, ...updates } as TreeItem;
          }
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateItemInTree(item.children),
            } as TreeItem;
          }
          return item;
        });
      };

      state.items = updateItemInTree(state.items);
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
      const newViewMode = action.payload;

      if (newViewMode === state.viewMode) return;

      console.log('Switching view mode from', state.viewMode, 'to', newViewMode);
      state.viewMode = newViewMode;

      state.items = [];
      state.originalApiData = null;
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
                ...data,
              },
              label: data.firstName && data.lastName
                ? `${data.firstName} ${data.lastName}`
                : personItem.label,
              subLabel: data.position || personItem.subLabel,
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
        state.items = action.payload.items;
        state.originalApiData = action.payload.originalApiData;
        state.error = null;

        if (action.payload.originalApiData) {
          saveOriginalApiData(action.payload.originalApiData);
        }

        saveTreeToLocalStorage(action.payload.items);
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
  updateItem,
} = treeSlice.actions;
export default treeSlice.reducer;