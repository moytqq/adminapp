import axios from 'axios';
import { ApiTreeItem } from '@/types/tree.types';
import Cookies from 'js-cookie';

export const API_BASE_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net/client_api';
const API_PROXY_URL = '/api/proxy/client_api';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const TOKEN_EXPIRES_KEY = 'token_expires';

export const createApi = () => {
  const api = axios.create({
    baseURL: API_PROXY_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use(
    (config) => {
      const token = Cookies.get(TOKEN_KEY);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(USER_ID_KEY);
        Cookies.remove(TOKEN_EXPIRES_KEY);

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return api;
};

export const api = createApi();

export const getToken = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const checkAuthAndRedirect = () => {
  const token = getToken();
  if (!token && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const authAPI = {
  checkToken: async (token: string) => {
    try {
      const response = await api.get(`/check_token?token=${token}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Ошибка авторизации');
      } else if (error.request) {
        throw new Error('Нет ответа от сервера');
      } else {
        throw new Error('Ошибка при выполнении запроса');
      }
    }
  },
};

export const treeApi = {
  getHierarchyTree: async (): Promise<ApiTreeItem[]> => {
    try {
      checkAuthAndRedirect();
      const response = await api.get('/get_hierarchy_tree');
      return response.data;
    } catch (error) {
      console.error('Error fetching hierarchy tree:', error);
      throw error;
    }
  },

  getAddressTree: async (): Promise<ApiTreeItem[]> => {
    try {
      checkAuthAndRedirect();
      const response = await api.get('/get_address_tree');
      return response.data;
    } catch (error) {
      console.error('Error fetching address tree:', error);
      throw error;
    }
  },

  getItemDetails: async (id: number, type: string) => {
    try {
      checkAuthAndRedirect();

      const response = await api.get(`/get_item_details/${type}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item details for ${type} ${id}:`, error);
      throw error;
    }
  },

  updateItem: async (id: number, updates: Partial<ApiTreeItem>) => {
    try {
      checkAuthAndRedirect();

      const response = await api.put(`/update_item/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },
};