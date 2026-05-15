import axios from 'axios';
import Cookies from 'js-cookie';

const API_PROXY_URL = '/api/proxy/client_api';

const getHeaders = () => {
  const token = Cookies.get('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Suggestion {
  id: number;
  hid: number | null;
  category: 'correction' | 'message';
  text: string;
  contact: string | null;
  created_at: string;
}

export const proposesApi = {
  submit: async (data: {
    category: 'correction' | 'message';
    text: string;
    contact?: string;
  }): Promise<{ status: string; message: string }> => {
    const response = await axios.post(
      `${API_PROXY_URL}/suggestions/submit`,
      data,
      { headers: getHeaders() },
    );
    return response.data;
  },

  getAll: async (): Promise<{ status: string; data?: Suggestion[]; message?: string }> => {
    const response = await axios.get(`${API_PROXY_URL}/suggestions/list`, {
      headers: getHeaders(),
    });
    return response.data;
  },
};
