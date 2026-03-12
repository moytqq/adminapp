import { api } from './api';

export interface ChatUser {
  id: number;
  name: string;
  parent_id: number;
  type: string;
  description?: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  hid: number;
  timestamp: string;
  message: string;
  is_readed: 0 | 1;
}

export interface ChatListItem {
  id: number;
  hid_from: number;
  hid_to: number;
  created_at: string;
  last_message: ChatMessage | string;
}

export interface ChatDetails {
  id: number;
  hid_from: number;
  hid_to: number;
  created_at: string;
  userFrom?: ChatUser;
  userTo?: ChatUser;
}

export interface ChatMessagesResponse {
  status: 'success' | 'error';
  data: ChatMessage[];
  current_time: string;
  chat: {
    status: string;
    data: ChatDetails;
    userFrom: ChatUser;
    userTo: ChatUser;
  };
}

export interface CreateChatResponse {
  status: 'success' | 'error';
  data?: ChatDetails;
  message?: string;
}

export const chatApi = {
  getChatList: async (): Promise<ChatListItem[]> => {
    try {
      const response = await api.get('/chat/get_chat_list');
      if (response.data.status === 'success') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching chat list:', error);
      throw error;
    }
  },

  getSendersList: async (): Promise<ChatUser[]> => {
    try {
      const response = await api.get('/chat/get_hid_for_chat');
      if (response.data.status === 'success') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching senders list:', error);
      throw error;
    }
  },

  getReceiversList: async (): Promise<ChatUser[]> => {
    try {
      const response = await api.get('/chat/get_users_list');
      if (response.data.status === 'success') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching receivers list:', error);
      throw error;
    }
  },

  createChat: async (hid_from: number, hid_to: number): Promise<CreateChatResponse> => {
    try {
      const response = await api.get(`/chat/create_chat?hid_from=${hid_from}&hid_to=${hid_to}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  getMessages: async (chat_id: number): Promise<ChatMessagesResponse> => {
    try {
      const response = await api.get(`/chat/get_messages?chat_id=${chat_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessage: async (chat_id: number, message: string, from_hid: number): Promise<any> => {
    try {
      const response = await api.post('/chat/send_message', {
        chat_id: chat_id.toString(),
        message,
        from_hid
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
};