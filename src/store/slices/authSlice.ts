import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

interface AuthState {
  token: string | null;
  userId: number | null;
  flags: string[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  tokenFromUrl: string | null;
}

const TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';
const FLAGS_KEY = 'user_flags';
const TOKEN_FROM_URL_KEY = 'token_from_url';

const getTokenFromCookies = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

const getUserIdFromCookies = (): number | null => {
  const userId = Cookies.get(USER_ID_KEY);
  return userId ? parseInt(userId, 10) : null;
};

const getFlagsFromCookies = (): string[] => {
  const flags = Cookies.get(FLAGS_KEY);
  return flags ? JSON.parse(flags) : [];
};

const initialState: AuthState = {
  token: getTokenFromCookies(),
  userId: getUserIdFromCookies(),
  flags: getFlagsFromCookies(),
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
      flags?: string[];
    }>) => {
      const { token, userId, flags = [] } = action.payload;

      state.token = token;
      state.userId = userId;
      state.flags = flags;
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

      Cookies.set(FLAGS_KEY, JSON.stringify(flags), {
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
      state.flags = [];
      state.status = 'idle';
      state.error = null;

      Cookies.remove(TOKEN_KEY);
      Cookies.remove(USER_ID_KEY);
      Cookies.remove(FLAGS_KEY);
    },

    initializeAuth: (state) => {
      state.token = getTokenFromCookies();
      state.userId = getUserIdFromCookies();
      state.flags = getFlagsFromCookies();
      state.tokenFromUrl = Cookies.get(TOKEN_FROM_URL_KEY) || null;

      if (state.token && state.userId) {
        state.status = 'succeeded';
      }
    },

    updateFlags: (state, action: PayloadAction<string[]>) => {
      state.flags = action.payload;
      Cookies.set(FLAGS_KEY, JSON.stringify(action.payload), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    },
  },
});

export const {
  setToken,
  setLoading,
  setError,
  logout,
  initializeAuth,
  setTokenFromUrl,
  clearTokenFromUrl,
  updateFlags
} = authSlice.actions;
export default authSlice.reducer;