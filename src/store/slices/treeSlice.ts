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
import { fetchMockTreeData, fetchTreeDataFromApi } from '@/utils/treeHelpers';
import { treeApi } from '@/services/api';
import { buildTreeFromApiData, enhanceTreeDataWithMockInfo } from '@/utils/apiTransformers';
import { transformTreeDataByViewMode } from '@/utils/storeDepartmentTransformer';

const TREE_STORAGE_KEY = 'company-tree-data';
const ORIGINAL_API_DATA_KEY = 'company-original-api-data';

const saveTreeToLocalStorage = (items: TreeItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(items));
  }
};

const saveOriginalApiData = (apiData: ApiTreeItem[] | null) => {
  if (typeof window !== 'undefined' && apiData) {
    localStorage.setItem(ORIGINAL_API_DATA_KEY, JSON.stringify(apiData));
  }
};

const loadOriginalApiData = (): ApiTreeItem[] | null => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem(ORIGINAL_API_DATA_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing saved original API data:', error);
      }
    }
  }
  return null;
};
const getInitialState = (): TreeState => {
  if (typeof window !== 'undefined') {
    const savedData = localStorage.getItem(TREE_STORAGE_KEY);
    const savedOriginalData = loadOriginalApiData();

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('Loading initial state from localStorage');
          return {
            items: parsedData,
            originalApiData: savedOriginalData,
            selectedItemId: null,
            loading: false,
            error: null,
            viewMode: 'hierarchy',
          };
        }
      } catch (error) {
        console.error('Error parsing saved tree data:', error);
      }
    }
  }

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

      const savedOriginalData = loadOriginalApiData();
      let apiData: ApiTreeItem[];

      if (savedOriginalData && savedOriginalData.length > 0) {
        console.log('Using saved original API data from localStorage');
        apiData = savedOriginalData;
      } else {
        console.log('Fetching fresh data from API');
        apiData = await treeApi.getHierarchyTree();
        saveOriginalApiData(apiData);
      }

      const savedData = localStorage.getItem(TREE_STORAGE_KEY);
      if (savedData && savedOriginalData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData && parsedData.length > 0) {
            const isStoreMode = viewMode === 'store-departments';
            const firstItem = parsedData[0];
            const isCurrentlyStoreMode = firstItem && firstItem.type === TreeItemType.STORE;

            if (isStoreMode === isCurrentlyStoreMode) {
              console.log('Using existing tree data for current view mode');
              return {
                items: parsedData,
                originalApiData: savedOriginalData,
              };
            }
          }
        } catch (error) {
          console.error('Error checking saved data:', error);
        }
      }

      let treeData = buildTreeFromApiData(apiData);
      treeData = enhanceTreeDataWithMockInfo(treeData);

      if (viewMode === 'store-departments') {
        treeData = transformTreeDataByViewMode(apiData, treeData, viewMode);
      }

      console.log('Built new tree data for viewMode:', viewMode);
      saveTreeToLocalStorage(treeData);

      return {
        items: treeData,
        originalApiData: apiData,
      };
    } catch (error: any) {
      console.error('Error in loadTreeData:', error);

      const savedData = localStorage.getItem(TREE_STORAGE_KEY);
      const savedOriginalData = loadOriginalApiData();

      if (savedData && savedOriginalData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData && parsedData.length > 0) {
            return {
              items: parsedData,
              originalApiData: savedOriginalData,
            };
          }
        } catch (parseError) {
          console.error('Error parsing saved data:', parseError);
        }
      }

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

      if (state.originalApiData && state.originalApiData.length > 0) {
        console.log('Rebuilding tree with original API data');

        let treeData = buildTreeFromApiData(state.originalApiData);
        //treeData = enhanceTreeDataWithMockInfo(treeData);

        if (newViewMode === 'store-departments') {
          treeData = transformTreeDataByViewMode(state.originalApiData, treeData, newViewMode);
        }

        const oldItemsMap = new Map<string, TreeItem>();
        const mapItems = (items: TreeItem[]) => {
          items.forEach(item => {
            oldItemsMap.set(item.id, item);
            if (item.children) {
              mapItems(item.children);
            }
          });
        };
        mapItems(state.items);

        const newTreeData = treeData.map(item => {
          const oldItem = oldItemsMap.get(item.id);

          let shouldBeExpanded = oldItem ? oldItem.isExpanded : false;

          if (newViewMode === 'store-departments' && item.type === TreeItemType.STORE) {
            shouldBeExpanded = false;
          }

          const newItem = {
            ...item,
            isExpanded: shouldBeExpanded
          };

          if (item.children && item.children.length > 0) {
            const updateChildren = (children: TreeItem[]): TreeItem[] => {
              return children.map(child => {
                const oldChild = oldItemsMap.get(child.id);
                return {
                  ...child,
                  isExpanded: oldChild ? oldChild.isExpanded : false
                };
              });
            };
            newItem.children = updateChildren(item.children);
          }

          return newItem;
        });

        state.items = newTreeData;
        saveTreeToLocalStorage(newTreeData);
        console.log('Tree rebuilt for new view mode');
      } else {
        console.warn('Cannot rebuild tree: original API data not available');

        const resetExpanded = (items: TreeItem[]): TreeItem[] => {
          return items.map(item => {
            const newItem = {
              ...item,
              isExpanded: false
            };
            if (item.children && item.children.length > 0) {
              newItem.children = resetExpanded(item.children);
            }
            return newItem;
          });
        };

        state.items = resetExpanded(state.items);
        saveTreeToLocalStorage(state.items);
      }
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