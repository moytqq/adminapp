import { api } from './api';

export interface Person {
  id: number;
  name: string;
  parent_id: number;
  type: string;
  description: string;
}

export interface SalaryListItem {
  person: Person;
  summary: number;
  addition: number;
}

export interface GrowthItem {
  item: Person & { type: 'Store' };
  growth: number;
  current_value: number;
  previous_value: number;
}

export interface AttendanceItem {
  item: Person & { type: 'Store' };
  attendance: number[];
}

export interface MonthOption {
  id: number;
  month: string;
}

export interface DistanceItem {
  item: Person & { type: 'Store' };
  distance: number;
}

export interface SalaryDetails {
  summary: number;
  person: Person;
  details: {
    growth: GrowthItem[];
    attendance: AttendanceItem[];
    distance: DistanceItem[];
    additions: any[];
  };
}

export interface SalaryListResponse {
  status: 'success' | 'error';
  data: SalaryListItem[];
}

export interface SalaryDetailsResponse {
  status: 'success' | 'error';
  data: SalaryDetails;
}

export const salaryApi = {
  getList: async (month: string): Promise<SalaryListItem[]> => {
    try {
      const response = await api.get(`/zarplati/list?month=${month}`);
      if (response.data.status === 'success') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching salary list:', error);
      throw error;
    }
  },

  getDetails: async (month: string, hid: number): Promise<SalaryDetails> => {
    try {
      const response = await api.get(`/zarplati/summary?month=${month}&hid=${hid}`);
      if (response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Failed to load salary details');
    } catch (error) {
      console.error('Error fetching salary details:', error);
      throw error;
    }
  },
  getMonths: async (): Promise<MonthOption[]> => {
    try {
      const response = await api.get('/zarplati/month');
      if (response.data.status === 'success') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching months:', error);
      throw error;
    }
  },
};