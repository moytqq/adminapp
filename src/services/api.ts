import axios from 'axios';
import { ApiTreeItem } from '@/types/tree.types';
import Cookies from 'js-cookie';
import { getStore } from '@/store/storeAccessor';

export const API_BASE_URL = 'https://o4wb-xcdb-nu1f.gw-1a.dockhost.net/client_api';
const API_PROXY_URL = '/api/proxy/client_api';

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const FLAGS_KEY = 'user_flags';

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_PROXY_URL}/check_token?token=${token}`);
    const data = response.data;

    if (data.status === 'valid') {
      if (data.flags) {
        Cookies.set(FLAGS_KEY, JSON.stringify(data.flags), {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
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
  Cookies.remove(FLAGS_KEY);

  try {
    localStorage.setItem('login_error', message || 'Сессия истекла, войдите снова');
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const getRequiredFlagsForEndpoint = (url: string): string[] => {
  if (url.includes('/login') || url.includes('/check_token')) {
    return [];
  }

  if (url.includes('/get_hierarchy_tree') || url.includes('/get_address_tree')) {
    return [];
  }

  if (url.includes('/services') || url.includes('/service')) {
    return ['SERVICE', 'SERVICE_ADMIN', 'ADMIN'];
  }
  if (url.includes('/autoorders') || url.includes('/orders') || url.includes('/auto-orders')) {
    return ['LS_AUTOZAKAZI', 'TM_AUTOZAKAZI', 'ADMIN'];
  }
  if (url.includes('/otchet') || url.includes('/results')) {
    return ['RESULTS', 'ADMIN'];
  }
  if (url.includes('/chat')) {
    return ['CHAT', 'ADMIN'];
  }
  if (url.includes('/personal') || url.includes('/staff')) {
    return ['ADMIN'];
  }
  if (url.includes('/planner')) {
    return ['ADMIN'];
  }
  if (url.includes('/ostatki')) {
    return ['LS_AUTOZAKAZI', 'TM_AUTOZAKAZI', 'ADMIN'];
  }
  if (url.includes('/zarplati')) {
    return ['ADMIN'];
  }

  return [];
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
      const flagsStr = Cookies.get(FLAGS_KEY);
      const flags = flagsStr ? JSON.parse(flagsStr) : [];

      const isAuthRequest = config.url?.includes('/login') || config.url?.includes('/check_token');

      if (token && !isAuthRequest) {
        try {
          const isValid = await validateToken(token);
          if (!isValid) {
            handleExpiredToken('Токен недействителен');
            return Promise.reject(new Error('Token invalid'));
          }

          const requiredFlags = getRequiredFlagsForEndpoint(config.url || '');
          if (requiredFlags.length > 0) {
            const hasAccess = flags.includes('ADMIN') || requiredFlags.some(f => flags.includes(f));

            if (!hasAccess) {
              console.warn(`Access denied to ${config.url}. Required flags: ${requiredFlags.join(', ')}, User flags: ${flags.join(', ')}`);
              handleExpiredToken('Нет доступа к этому ресурсу');
              return Promise.reject(new Error('Access denied'));
            }
          }
        } catch (error) {
          handleExpiredToken('Ошибка проверки доступа');
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

export const getUserFlags = (): string[] => {
  const flags = Cookies.get(FLAGS_KEY);
  return flags ? JSON.parse(flags) : [];
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