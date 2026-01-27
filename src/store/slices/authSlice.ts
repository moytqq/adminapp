import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface AuthState {
  token: string | null;
  userId: number | null;
  expiresAt: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRES_KEY = 'token_expires';
const USER_ID_KEY = 'user_id';

const getTokenFromCookies = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

const getUserIdFromCookies = (): number | null => {
  const userId = Cookies.get(USER_ID_KEY);
  return userId ? parseInt(userId, 10) : null;
};

const getExpiresFromCookies = (): string | null => {
  return Cookies.get(TOKEN_EXPIRES_KEY) || null;
};

const initialState: AuthState = {
  token: getTokenFromCookies(),
  userId: getUserIdFromCookies(),
  expiresAt: getExpiresFromCookies(),
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<{
      token: string;
      userId: number;
      expiresAt: string;
    }>) => {
      const { token, userId, expiresAt } = action.payload;

      state.token = token;
      state.userId = userId;
      state.expiresAt = expiresAt;
      state.status = 'succeeded';
      state.error = null;

      Cookies.set(TOKEN_KEY, token, {
        expires: new Date(expiresAt),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      Cookies.set(USER_ID_KEY, userId.toString(), {
        expires: new Date(expiresAt),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      Cookies.set(TOKEN_EXPIRES_KEY, expiresAt, {
        expires: new Date(expiresAt),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    },

    setLoading: (state) => {
      state.status = 'loading';
    },

    setError: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    },

    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.expiresAt = null;
      state.status = 'idle';
      state.error = null;

      Cookies.remove(TOKEN_KEY);
      Cookies.remove(USER_ID_KEY);
      Cookies.remove(TOKEN_EXPIRES_KEY);
    },

    initializeAuth: (state) => {
      state.token = getTokenFromCookies();
      state.userId = getUserIdFromCookies();
      state.expiresAt = getExpiresFromCookies();

      if (state.token && state.userId && state.expiresAt) {
        const expiresAtDate = new Date(state.expiresAt);
        const now = new Date();

        if (now < expiresAtDate) {
          state.status = 'succeeded';
        } else {
          state.token = null;
          state.userId = null;
          state.expiresAt = null;
          Cookies.remove(TOKEN_KEY);
          Cookies.remove(USER_ID_KEY);
          Cookies.remove(TOKEN_EXPIRES_KEY);
        }
      }
    },
  },
});

export const { setToken, setLoading, setError, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;