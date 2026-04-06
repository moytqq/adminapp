import { api } from './api';

export interface MonthReport {
  id: number;
  addr: number;
  c: number;
  t: number;
  s: number;
  date: string;
}

export interface ProductSale {
  id: number;
  address: string;
  timestamp: string;
  name: string;
  count: number;
  sum: number;
}

export interface ReportsResponse {
  status: 'success' | 'error';
  data: MonthReport[];
}

export interface ProductSalesResponse {
  status: 'success' | 'error';
  data: ProductSale[];
}

export const reportsApi = {
  getMonths: async (hid: string): Promise<MonthReport[]> => {
    try {
      const response = await api.get<ReportsResponse>(`/otchet/get_months?hid=${hid}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching months data:', error);
      return [];
    }
  },

  getDrinksSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_napitki_mes?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching product sales:', error);
      return [];
    }
  },
  getDessertsSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_dec_mes_2?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching desserts sales:', error);
      return [];
    }
  },
  getBreadSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_bread_mes?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching bread sales:', error);
      return [];
    }
  },

  getSaladsSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_salads_mes?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching salads sales:', error);
      return [];
    }
  },

  getSoupsSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_soups_mes?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching soups sales:', error);
      return [];
    }
  },

  getHotSales: async (address: string): Promise<ProductSale[]> => {
    try {
      const response = await api.get<ProductSalesResponse>(`/otchet/get_prodaji_hot_mes?addr=${encodeURIComponent(address)}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching hot sales:', error);
      return [];
    }
  },

};