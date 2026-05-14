import { api } from './api';

export interface ServiceType {
  id: number;
  type: string;
  name: string;
}

export interface ServiceLog {
  id: number;
  reg_id: number;
  type: string;
  message: string;
  status: string;
  timestamp: string;
  hid: number;
}

export interface ServiceRequest {
  id: number;
  type: string;
  address: number;
  logs: ServiceLog[];
}

export interface RegisterServiceResponse {
  status: string;
  message: string;
}

export interface ChangeStatusResponse {
  status: string;
  message: string;
}

export interface HierarchyItem {
  id: number;
  name: string;
  type: string;
  parent_id: number;
  description: string;
}

export const serviceApi = {
  getHierarchyItem: async (hid: number): Promise<HierarchyItem | null> => {
    try {
      const response = await api.get(`/get_hierarchy_item?hid=${hid}`);
      if (response.data?.status === 'success') {
        return response.data.data as HierarchyItem;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching hierarchy item ${hid}:`, error);
      return null;
    }
  },


  getTypes: async (): Promise<ServiceType[]> => {
    try {
      const response = await api.get('/service/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
  },

  registerService: async (type: string, address: number, message?: string): Promise<RegisterServiceResponse> => {
    try {
      const response = await api.post('/service/register', {
        type,
        address,
        message: message || ''
      });
      return response.data;
    } catch (error: any) {
      console.error('Error registering service:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Ошибка при регистрации'
      };
    }
  },

  getServiceList: async (): Promise<ServiceRequest[]> => {
    try {
      const response = await api.get('/service/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching service list:', error);
      throw error;
    }
  },

  changeStatus: async (regId: number, type: string, status: string, message?: string): Promise<ChangeStatusResponse> => {
    try {
      const response = await api.post('/service/change_status', {
        regId,
        type,
        message: message || '',
        status
      });
      return response.data;
    } catch (error: any) {
      console.error('Error changing service status:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Ошибка при изменении статуса'
      };
    }
  },
};