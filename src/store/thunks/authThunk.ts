import { createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';
import { setToken, setLoading, setError } from '../slices/authSlice';

interface CheckTokenResponse {
  status: string;
  message: string;
  userId?: number;
  expiresAt?: string;
}

export const checkToken = createAsyncThunk(
  'auth/checkToken',
  async (token: string, { dispatch }) => {
    try {
      dispatch(setLoading());

      const data: CheckTokenResponse = await authAPI.checkToken(token);

      if (data.status === 'valid' && data.userId && data.expiresAt) {
        dispatch(setToken({
          token,
          userId: data.userId,
          expiresAt: data.expiresAt,
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

export const checkTokenFromUrl = createAsyncThunk(
  'auth/checkTokenFromUrl',
  async (token: string, { dispatch }) => {
    try {
      const data: CheckTokenResponse = await authAPI.checkToken(token);

      if (data.status === 'valid' && data.userId && data.expiresAt) {
        dispatch(setToken({
          token,
          userId: data.userId,
          expiresAt: data.expiresAt,
        }));
        return { success: true, data };
      } else {
        return { success: false, data };
      }
    } catch (error: any) {
      throw error;
    }
  }
);