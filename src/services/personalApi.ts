import { api } from './api';
import { LinearStaff, Position, StaffInfo } from '@/types/personal.types';

export const personalApi = {
  addStaff: async (data: { fio: string; doe: string }): Promise<LinearStaff> => {
    try {
      const response = await api.post('/personal/add_ls', data);
      return response.data;
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  },

  updateStaff: async (data: { lsid: string; fio: string; doe: string }): Promise<LinearStaff> => {
    try {
      const response = await api.post('/personal/update_ls', data);
      return response.data;
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  getAllStaff: async (): Promise<LinearStaff[]> => {
    try {
      const response = await api.get('/personal/get_all_ls');
      return response.data.lsList || [];
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  getStaff: async (lsid: string): Promise<LinearStaff> => {
    try {
      const response = await api.get(`/personal/get_ls?lsid=${lsid}`);
      return response.data.ls;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  },

  deleteStaff: async (lsid: string): Promise<void> => {
    try {
      await api.get(`/personal/delete_ls?lsid=${lsid}`);
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  addPosition: async (data: { hid: string; name: string }): Promise<Position> => {
    try {
      const response = await api.post('/personal/add_pos', data);
      return response.data;
    } catch (error) {
      console.error('Error adding position:', error);
      throw error;
    }
  },

  updatePosition: async (data: { id?: number; name: string; lsid: string | null }): Promise<Position> => {
    try {
      const response = await api.post('/personal/update_pos', data);
      return response.data;
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  },

  getPositionsByHid: async (hid: string): Promise<Position[]> => {
    try {
      const response = await api.get(`/personal/get_pos?hid=${hid}`);
      return response.data.positions || [];
    } catch (error) {
      console.error(`Error fetching positions for hid ${hid}:`, error);
      return [];
    }
  },

  getAllPositions: async (): Promise<Position[]> => {
    try {
      const response = await api.get('/personal/get_all_pos');
      return response.data.positions || [];
    } catch (error) {
      console.error('Error fetching all positions:', error);
      throw error;
    }
  },

  deletePosition: async (id: number): Promise<void> => {
    try {
      await api.get(`/personal/delete_pos?id=${id}`);
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  },

  addInfo: async (data: { lsid: string; type: string; label: string; value: string }): Promise<StaffInfo> => {
    try {
      const response = await api.post('/personal/add_info', data);
      return response.data;
    } catch (error) {
      console.error('Error adding staff info:', error);
      throw error;
    }
  },

  updateInfo: async (data: { id: number; type: string; label: string; value: string }): Promise<StaffInfo> => {
    try {
      const response = await api.post('/personal/update_info', data);
      return response.data;
    } catch (error) {
      console.error('Error updating staff info:', error);
      throw error;
    }
  },

  getInfo: async (lsid: string): Promise<StaffInfo[]> => {
    try {
      const response = await api.get(`/personal/get_info?lsid=${lsid}`);
      return response.data.lsInfo || [];
    } catch (error) {
      console.error('Error fetching staff info:', error);
      return [];
    }
  },

  deleteInfo: async (id: number): Promise<void> => {
    try {
      await api.get(`/personal/delete_info?id=${id}`);
    } catch (error) {
      console.error('Error deleting staff info:', error);
      throw error;
    }
  },

  getViewStores: async () => {
    try {
      const response = await api.get('/personal/manager/view-stores');
      return response.data;
    } catch (error) {
      console.error('Error fetching view stores:', error);
      throw error;
    }
  },

  getManagerStores: async () => {
    try {
      const response = await api.get('/personal/manager/stores');
      return response.data;
    } catch (error) {
      console.error('Error fetching manager stores:', error);
      throw error;
    }
  },

  saveManagerStore: async (storeHid: number, positions: any[]) => {
    try {
      const response = await api.post('/personal/manager/save-store', {
        store_hid: storeHid,
        positions,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving manager store report:', error);
      throw error;
    }
  },
};