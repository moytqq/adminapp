import { createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';
import { setToken, setLoading, setError, logout, updateFlags } from '../slices/authSlice';
import { hashPasswordWithSalt } from '@/utils/crypto';
import { RootState } from '@/store/store';

interface LoginResponse {
  status: string;
  message: string;
  token: string;
  userId: number;
}

interface CheckTokenResponse {
  status: string;
  message: string;
  userId?: number;
  flags?: string[];
  expiresAt?: string;
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ login, password }: { login: string; password: string }, { dispatch }) => {
    try {
      dispatch(setLoading());

      const salt = '96678763';
      const hashedPassword = await hashPasswordWithSalt(password, salt);

      const data: LoginResponse = await authAPI.login(login, hashedPassword);

      if (data.status === 'success') {
        const tokenData = await authAPI.checkToken(data.token);

        console.log('Login successful, received flags:', tokenData.flags);

        dispatch(setToken({
          token: data.token,
          userId: data.userId,
          flags: tokenData.flags || [],
        }));
        return { success: true, data };
      } else {
        dispatch(setError(data.message || 'Ошибка авторизации'));
        return { success: false, data };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      dispatch(setError(error.message || 'Ошибка при входе'));
      throw error;
    }
  }
);

export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) {
      return { success: false };
    }

    try {
      dispatch(setLoading());
      const data: CheckTokenResponse = await authAPI.checkToken(token);

      console.log('Token validation result:', data.status, data.flags);

      if (data.status === 'valid' && data.userId) {
        dispatch(setToken({
          token,
          userId: data.userId,
          flags: data.flags || [],
        }));
        return { success: true, data };
      } else {
        console.warn('Token invalid, logging out');
        dispatch(logout());
        return { success: false, data };
      }
    } catch (error: any) {
      console.error('Token validation error:', error);
      dispatch(logout());
      dispatch(setError(error.message || 'Ошибка при проверке токена'));
      return { success: false };
    }
  }
);

export const checkTokenFromUrl = createAsyncThunk(
  'auth/checkTokenFromUrl',
  async (token: string, { dispatch }) => {
    try {
      dispatch(setLoading());
      const data: CheckTokenResponse = await authAPI.checkToken(token);

      if (data.status === 'valid' && data.userId) {
        dispatch(setToken({
          token,
          userId: data.userId,
          flags: data.flags || [],
        }));
        return { success: true, data };
      } else {
        dispatch(setError(data.message || 'Неверный токен'));
        return { success: false, data };
      }
    } catch (error: any) {
      dispatch(setError(error.message || 'Ошибка при проверке токена'));
      throw error;
    }
  }
);

export const refreshFlags = createAsyncThunk(
  'auth/refreshFlags',
  async (_, { dispatch, getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (!token) return;

    try {
      const data: CheckTokenResponse = await authAPI.checkToken(token);
      if (data.flags) {
        dispatch(updateFlags(data.flags));
      }
    } catch (error) {
      console.error('Error refreshing flags:', error);
    }
  }
);