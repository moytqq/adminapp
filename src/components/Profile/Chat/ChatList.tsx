'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { ChatListItem, chatApi, ChatDetails, ChatUser } from '@/services/chatApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './ChatList.module.scss';
import { MessageCircle, Check, CheckCheck } from 'lucide-react';

interface ChatListProps {
  onSelectChat: (chatId: number) => void;
  selectedChatId?: number;
}

interface ChatWithDetails extends ChatListItem {
  chatDetails?: {
    chat: ChatDetails;
    userFrom: ChatUser;
    userTo: ChatUser;
  };
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = async () => {
    setLoading(true);
    try {
      const chatList = await chatApi.getChatList();

      const chatsWithDetails = await Promise.all(
        chatList.map(async (chat) => {
          try {
            const messages = await chatApi.getMessages(chat.id);
            return {
              ...chat,
              chatDetails: {
                chat: messages.chat.data,
                userFrom: messages.chat.userFrom,
                userTo: messages.chat.userTo,
              },
            };
          } catch (err) {
            console.error(`Error loading details for chat ${chat.id}:`, err);
            return chat;
          }
        })
      );

      setChats(chatsWithDetails);
    } catch (err) {
      setError('Ошибка загрузки чатов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const getChatName = (chat: ChatWithDetails): string => {
    if (chat.chatDetails) {
      return chat.chatDetails.userTo.name;
    }
    // Запасной вариант
    return `Чат #${chat.id}`;
  };

  const getChatType = (chat: ChatWithDetails): string => {
    if (chat.chatDetails) {
      const type = chat.chatDetails.userTo.type;
      return type === 'Person' ? 'Сотрудник' :
        type === 'Department' ? 'Департамент' : 'Компания';
    }
    return '';
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = (chat: ChatWithDetails): string => {
    if (typeof chat.last_message === 'string') {
      return chat.last_message;
    }
    return chat.last_message.message || '';
  };

  const isLastMessageRead = (chat: ChatWithDetails): boolean => {
    if (typeof chat.last_message === 'string') return false;
    return chat.last_message.is_readed === 1;
  };

  const getLastMessageTime = (chat: ChatWithDetails): string => {
    if (typeof chat.last_message === 'string') return '';
    return formatMessageTime(chat.last_message.timestamp);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка чатов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadChats}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      {chats.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageCircle size={48} />
          <p>У вас пока нет чатов</p>
          <p className={styles.emptyHint}>Создайте новый чат, чтобы начать общение</p>
        </div>
      ) : (
        chats.map(chat => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${selectedChatId === chat.id ? styles.selected : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className={styles.chatAvatar}>
              <MessageCircle size={20} />
            </div>
            <div className={styles.chatInfo}>
              <div className={styles.chatHeader}>
                <div className={styles.chatNameContainer}>
                  <span className={styles.chatName}>{getChatName(chat)}</span>
                  {chat.chatDetails && (
                    <span className={styles.chatType}>{getChatType(chat)}</span>
                  )}
                </div>
                <span className={styles.chatTime}>{getLastMessageTime(chat)}</span>
              </div>
              <div className={styles.lastMessage}>
                <span className={styles.messagePreview}>
                  {getLastMessagePreview(chat)}
                </span>
                {typeof chat.last_message !== 'string' && (
                  <span className={styles.readStatus}>
                    {isLastMessageRead(chat) ? (
                      <CheckCheck size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;