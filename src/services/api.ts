import axios from 'axios';
import { ApiTreeItem } from '@/types/tree.types';
import Cookies from 'js-cookie';

export const API_BASE_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net/client_api';
const API_PROXY_URL = '/api/proxy/client_api';

const TOKEN_KEY = 'auth_token';

const getToken = (): string | null => {
    return Cookies.get(TOKEN_KEY) || null;
};

const api = axios.create({
  baseURL: API_PROXY_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: getToken() ? `Bearer ${getToken()}` : '',
  },
});

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
      const response = await api.get('/get_hierarchy_tree');
      return response.data;
    } catch (error) {
      console.error('Error fetching hierarchy tree:', error);
      throw error;
    }
  },

  getItemDetails: async (id: number, type: string) => {
    try {
      const response = await api.get(`/get_item_details/${type}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item details for ${type} ${id}:`, error);
      throw error;
    }
  },

  updateItem: async (id: number, updates: Partial<ApiTreeItem>) => {
    try {
      const response = await api.put(`/update_item/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },

};