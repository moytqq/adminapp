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

  getProductSales: async (address: string): Promise<ProductSale[]> => {
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
};