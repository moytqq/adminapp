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

  uploadAvatar: async (file: File): Promise<{ status: string; message?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  changePassword: async (
    oldHashedPassword: string,
    newHashedPassword: string,
  ): Promise<{ status: string; message?: string }> => {
    const response = await api.post('/change_password', { oldHashedPassword, newHashedPassword });
    return response.data;
  },
};
