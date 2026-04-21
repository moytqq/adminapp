import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface AuthState {
  token: string | null;
  userId: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  tokenFromUrl: string | null;
}

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const TOKEN_FROM_URL_KEY = 'token_from_url';

const getTokenFromCookies = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

const getUserIdFromCookies = (): number | null => {
  const userId = Cookies.get(USER_ID_KEY);
  return userId ? parseInt(userId, 10) : null;
};

const initialState: AuthState = {
  token: getTokenFromCookies(),
  userId: getUserIdFromCookies(),
  status: 'idle',
  error: null,
  tokenFromUrl: Cookies.get(TOKEN_FROM_URL_KEY) || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<{
      token: string;
      userId: number;
    }>) => {
      const { token, userId } = action.payload;

      state.token = token;
      state.userId = userId;
      state.status = 'succeeded';
      state.error = null;

      Cookies.set(TOKEN_KEY, token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      Cookies.set(USER_ID_KEY, userId.toString(), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    },

    setTokenFromUrl: (state, action: PayloadAction<string>) => {
      state.tokenFromUrl = action.payload;
      Cookies.set(TOKEN_FROM_URL_KEY, action.payload, {
        expires: 1/24,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    },

    clearTokenFromUrl: (state) => {
      state.tokenFromUrl = null;
      Cookies.remove(TOKEN_FROM_URL_KEY);
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
      state.status = 'idle';
      state.error = null;

      Cookies.remove(TOKEN_KEY);
      Cookies.remove(USER_ID_KEY);
    },

    initializeAuth: (state) => {
      state.token = getTokenFromCookies();
      state.userId = getUserIdFromCookies();
      state.tokenFromUrl = Cookies.get(TOKEN_FROM_URL_KEY) || null;

      if (state.token && state.userId) {
        state.status = 'succeeded';
      }
    },
  },
});

export const { setToken, setLoading, setError, logout, initializeAuth, setTokenFromUrl, clearTokenFromUrl } = authSlice.actions;
export default authSlice.reducer;