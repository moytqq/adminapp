import { api } from './api';

export interface MonthReport {
  id: number;
  addr: number;
  c: number; // количество чеков
  t: number; // средняя сумма чека
  s: number; // общая сумма продаж
  date: string;
}

export interface ReportsResponse {
  status: 'success' | 'error';
  data: MonthReport[];
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
};