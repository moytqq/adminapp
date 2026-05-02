import { api } from './api';

export interface RemainderForm {
  id: number;
  name: string;
  parent: null | number;
  access: number;
  address: number;
}

export interface RemainderField {
  [key: string]: {
    id: number;
    sku_id: number;
    type: string;
    ostatki_reg_id: number;
  };
}

export interface SkuInfo {
  sku_id: number;
  name: string;
  name_short: string;
  artikul: string;
  packaging: string;
  packaging_supplier: string;
  category_id: number;
  is_ingredient: number;
  supplier_id: number;
  order_multiple: number;
  packaging_multiple: number;
}

export interface SaveRemainderItem {
  address: number;
  sku_id: number;
  value: number;
  date: string;
}

export interface SaveRemainderResponse {
  status: string;
  message: string;
}

export const remaindersApi = {
  getFormsList: async (): Promise<RemainderForm[]> => {
    try {
      const response = await api.get('/ostatki/reg_list');
      return response.data;
    } catch (error) {
      console.error('Error fetching forms list:', error);
      throw error;
    }
  },

  getFieldsByRegId: async (regId: number): Promise<RemainderField> => {
    try {
      const response = await api.get(`/ostatki/fields_by_reg_id?reg_id=${regId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fields:', error);
      throw error;
    }
  },

  getSkuById: async (skuId: number): Promise<SkuInfo> => {
    try {
      const response = await api.get(`/ostatki/get_sku_by_sku_id?sku_id=${skuId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching SKU info:', error);
      throw error;
    }
  },

  getSkusByIds: async (skuIds: number[]): Promise<SkuInfo[]> => {
    try {
      const response = await api.post('/ostatki/get_skus_by_sku_ids', { sku_ids: skuIds });
      return response.data;
    } catch (error) {
      console.error('Error fetching SKUs info:', error);
      throw error;
    }
  },

  saveRemainders: async (data: SaveRemainderItem[]): Promise<SaveRemainderResponse> => {
    try {
      const response = await api.post('/ostatki/post_stock', data);
      return response.data;
    } catch (error) {
      console.error('Error saving remainders:', error);
      throw error;
    }
  },
};