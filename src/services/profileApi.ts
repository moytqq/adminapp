import { api } from './api';

export interface UserProfile {
  name: string;
  logins: string[];
  birthday: string | null;
  phone: string | null;
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data: { birthday?: string | null; phone?: string | null }): Promise<void> => {
    await api.patch('/profile', data);
  },

  changePassword: async (
    oldHashedPassword: string,
    newHashedPassword: string,
  ): Promise<{ status: string; message?: string }> => {
    const response = await api.post('/change_password', { oldHashedPassword, newHashedPassword });
    return response.data;
  },
};
