import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PersonalState, LinearStaff, Position, StaffInfo } from '@/types/personal.types';
import { personalApi } from '@/services/personalApi';

const initialState: PersonalState = {
  staff: [],
  positions: [],
  positionsByHid: {},
  staffInfo: {},
  loading: false,
  error: null,
  selectedHierarchyId: null,
};

export const loadAllStaff = createAsyncThunk(
  'personal/loadAllStaff',
  async (_, { rejectWithValue }) => {
    try {
      return await personalApi.getAllStaff();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки сотрудников');
    }
  },
);

export const loadAllPositions = createAsyncThunk(
  'personal/loadAllPositions',
  async (_, { rejectWithValue }) => {
    try {
      return await personalApi.getAllPositions();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки позиций');
    }
  },
);

export const loadPositionsByHid = createAsyncThunk(
  'personal/loadPositionsByHid',
  async (hid: string, { rejectWithValue }) => {
    try {
      const positions = await personalApi.getPositionsByHid(hid);
      return { hid, positions };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки позиций');
    }
  },
);

export const addStaff = createAsyncThunk(
  'personal/addStaff',
  async (data: { fio: string; doe: string }, { rejectWithValue, dispatch }) => {
    try {
      const result = await personalApi.addStaff(data);
      await dispatch(loadAllStaff());
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка добавления сотрудника');
    }
  },
);

export const updateStaff = createAsyncThunk(
  'personal/updateStaff',
  async (data: { lsid: string; fio: string; doe: string }, { rejectWithValue, dispatch }) => {
    try {
      const result = await personalApi.updateStaff(data);
      await dispatch(loadAllStaff());
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка обновления сотрудника');
    }
  },
);

export const deleteStaff = createAsyncThunk(
  'personal/deleteStaff',
  async (lsid: string, { rejectWithValue, dispatch }) => {
    try {
      await personalApi.deleteStaff(lsid);
      await dispatch(loadAllStaff());
      await dispatch(loadAllPositions());
      return lsid;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка удаления сотрудника');
    }
  },
);

export const addPosition = createAsyncThunk(
  'personal/addPosition',
  async (data: { hid: string; name: string }, { rejectWithValue, dispatch }) => {
    try {
      const result = await personalApi.addPosition(data);
      await dispatch(loadAllPositions());
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка добавления позиции');
    }
  },
);

export const updatePosition = createAsyncThunk(
  'personal/updatePosition',
  async (data: { id?: number; name: string; lsid: string | null }, { rejectWithValue, dispatch }) => {
    try {
      const result = await personalApi.updatePosition(data);
      await dispatch(loadAllPositions());
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка обновления позиции');
    }
  },
);

export const deletePosition = createAsyncThunk(
  'personal/deletePosition',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      await personalApi.deletePosition(id);
      await dispatch(loadAllPositions());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка удаления позиции');
    }
  },
);

export const loadStaffInfo = createAsyncThunk(
  'personal/loadStaffInfo',
  async (lsid: string, { rejectWithValue }) => {
    try {
      return await personalApi.getInfo(lsid);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки информации');
    }
  },
);

export const addStaffInfo = createAsyncThunk(
  'personal/addStaffInfo',
  async (data: { lsid: string; type: string; label: string; value: string }, { rejectWithValue, dispatch }) => {
    try {
      const result = await personalApi.addInfo(data);
      await dispatch(loadStaffInfo(data.lsid));
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка добавления информации');
    }
  },
);

export const updateStaffInfo = createAsyncThunk(
  'personal/updateStaffInfo',
  async (data: { id: number; type: string; label: string; value: string; lsid: string }, {
    rejectWithValue,
    dispatch,
  }) => {
    try {
      const result = await personalApi.updateInfo(data);
      await dispatch(loadStaffInfo(data.lsid));
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка обновления информации');
    }
  },
);

export const deleteStaffInfo = createAsyncThunk(
  'personal/deleteStaffInfo',
  async ({ id, lsid }: { id: number; lsid: string }, { rejectWithValue, dispatch }) => {
    try {
      await personalApi.deleteInfo(id);
      await dispatch(loadStaffInfo(lsid));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка удаления информации');
    }
  },
);

const personalSlice = createSlice({
  name: 'personal',
  initialState,
  reducers: {
    setSelectedHierarchyId: (state, action: PayloadAction<string | null>) => {
      state.selectedHierarchyId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPositionsByHid.fulfilled, (state, action) => {
        const { hid, positions } = action.payload;
        state.positionsByHid[hid] = positions;
      })
      .addCase(loadAllStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(loadAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addPosition.fulfilled, (state, action) => {
        const position = action.payload;
        const hid = position.hid;
        if (state.positionsByHid[hid]) {
          state.positionsByHid[hid] = [...state.positionsByHid[hid], position];
        }
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        const updatedPosition = action.payload;
        const hid = updatedPosition.hid;
        if (state.positionsByHid[hid]) {
          state.positionsByHid[hid] = state.positionsByHid[hid].map(p =>
            p.id === updatedPosition.id ? updatedPosition : p,
          );
        }
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        const positionId = action.payload;
        Object.keys(state.positionsByHid).forEach(hid => {
          state.positionsByHid[hid] = state.positionsByHid[hid].filter(
            p => p.id !== positionId,
          );
        });
      })
      .addCase(loadAllPositions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.positions = action.payload;
      })
      .addCase(loadAllPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(loadStaffInfo.fulfilled, (state, action) => {
        const lsid = action.meta.arg;
        state.staffInfo[lsid] = action.payload;
      })

      .addCase(addStaff.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      .addCase(deleteStaff.fulfilled, (state, action) => {
        delete state.staffInfo[action.payload];
      })

      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action: any) => {
          state.error = action.payload || 'Произошла ошибка';
        },
      );
  },
});

export const { setSelectedHierarchyId, clearError } = personalSlice.actions;
export default personalSlice.reducer;