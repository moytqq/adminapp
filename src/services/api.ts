import axios from 'axios';
import { ApiTreeItem } from '@/types/tree.types';
import Cookies from 'js-cookie';

export const API_BASE_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net/client_api';
const API_PROXY_URL = '/api/proxy/client_api';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_PROXY_URL}/check_token?token=${token}`);
    const data = response.data;

    if (data.status === 'valid') {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const handleExpiredToken = (message: string) => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);

  try {
    localStorage.setItem('login_error', message || 'Сессия истекла, войдите снова');
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const createApi = () => {
  const api = axios.create({
    baseURL: API_PROXY_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use(
    async (config) => {
      const token = Cookies.get(TOKEN_KEY);

      const isAuthRequest = config.url?.includes('/login') || config.url?.includes('/check_token');

      if (token && !isAuthRequest) {
        try {
          const isValid = await validateToken(token);
          if (!isValid) {
            handleExpiredToken('Токен недействителен');
            return Promise.reject(new Error('Token invalid'));
          }
        } catch (error) {
          handleExpiredToken('Ошибка проверки токена');
          return Promise.reject(error);
        }
      }

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
    (response) => {
      const data = response.data;

      if (data && (data.status === 'expired' || data.status === 'not_found' ||
        data.message === 'Токен истек' || data.message === 'Токен истёк' ||
        data.message === 'Токен не найден')) {
        handleExpiredToken(data.message);
        return Promise.reject(new Error(data.message));
      }

      return response;
    },
    (error) => {
      const responseData = error.response?.data;

      if (responseData && (responseData.status === 'expired' || responseData.status === 'not_found' ||
        responseData.message === 'Токен истек' || responseData.message === 'Токен истёк' ||
        responseData.message === 'Токен не найден')) {
        handleExpiredToken(responseData.message);
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
  login: async (login: string, hashedPassword: string) => {
    try {
      const response = await api.post('/login', {
        login,
        hashedpassword: hashedPassword
      });
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

  getAddressTree: async (): Promise<ApiTreeItem[]> => {
    try {
      const response = await api.get('/get_address_tree');
      return response.data.filter((item: ApiTreeItem | null) => item !== null);
    } catch (error) {
      console.error('Error fetching address tree:', error);
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