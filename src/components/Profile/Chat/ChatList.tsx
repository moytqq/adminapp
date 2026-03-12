'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChatListItem, chatApi, ChatUser } from '@/services/chatApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './ChatList.module.scss';
import { MessageCircle, Check, CheckCheck } from 'lucide-react';

interface ChatListProps {
  onSelectChat: (chatId: number) => void;
  selectedChatId?: number;
  refreshTrigger?: number;
  onUpdateChatCallback?: (callback: (chatId: number, isRead: boolean) => void) => void;
}

interface ChatWithNames extends ChatListItem {
  fromName?: string;
  toName?: string;
  fromType?: string;
  toType?: string;
}

const ChatList: React.FC<ChatListProps> = ({
                                             onSelectChat,
                                             selectedChatId,
                                             refreshTrigger,
                                             onUpdateChatCallback
                                           }) => {
  const [chats, setChats] = useState<ChatWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Map<number, ChatUser>>(new Map());
  const [currentUserHid, setCurrentUserHid] = useState<number | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [senders, receivers] = await Promise.all([
          chatApi.getSendersList(),
          chatApi.getReceiversList(),
        ]);

        const map = new Map<number, ChatUser>();
        [...senders, ...receivers].forEach(user => {
          map.set(user.id, user);
        });
        setUsersMap(map);

        if (senders.length > 0) {
          setCurrentUserHid(senders[0].id);
        }
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };

    loadUsers();
  }, []);

  const loadChats = useCallback(async () => {
    setLoading(true);
    try {
      const chatList = await chatApi.getChatList();

      const chatsWithNames = chatList.map(chat => {
        const fromUser = usersMap.get(chat.hid_from);
        const toUser = usersMap.get(chat.hid_to);

        return {
          ...chat,
          fromName: fromUser?.name,
          toName: toUser?.name,
          fromType: fromUser?.type,
          toType: toUser?.type,
        };
      });

      setChats(chatsWithNames);
    } catch (err) {
      setError('Ошибка загрузки чатов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [usersMap]);

  useEffect(() => {
    if (usersMap.size > 0) {
      loadChats();
    }
  }, [loadChats, refreshTrigger, usersMap]);

  const updateChatLastMessage = useCallback((chatId: number, isRead: boolean) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId && typeof chat.last_message !== 'string') {
          return {
            ...chat,
            last_message: {
              ...chat.last_message,
              is_readed: isRead ? 1 : 0
            }
          };
        }
        return chat;
      })
    );
  }, []);

  useEffect(() => {
    if (onUpdateChatCallback) {
      onUpdateChatCallback(updateChatLastMessage);
    }
  }, [onUpdateChatCallback, updateChatLastMessage]);

  const getChatName = (chat: ChatWithNames): string => {
    return chat.toName || `Чат #${chat.id}`;
  };

  const getChatType = (chat: ChatWithNames): string => {
    const type = chat.toType;
    if (!type) return '';
    return type === 'Person' ? 'Сотрудник' :
      type === 'Department' ? 'Департамент' : 'Компания';
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = (chat: ChatWithNames): string => {
    if (typeof chat.last_message === 'string') {
      return chat.last_message;
    }
    return chat.last_message.message || '';
  };

  const getLastMessageTime = (chat: ChatWithNames): string => {
    if (typeof chat.last_message === 'string') return '';
    return formatMessageTime(chat.last_message.timestamp);
  };

  const isLastMessageFromMe = (chat: ChatWithNames): boolean => {
    if (typeof chat.last_message === 'string' || !currentUserHid) return false;
    return chat.last_message.hid === currentUserHid;
  };

  const isLastMessageRead = (chat: ChatWithNames): boolean => {
    if (typeof chat.last_message === 'string') return false;
    return chat.last_message.is_readed === 1;
  };

  const showUnreadIndicator = (chat: ChatWithNames): boolean => {
    if (typeof chat.last_message === 'string' || !currentUserHid) return false;
    return !isLastMessageFromMe(chat) && !isLastMessageRead(chat);
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
                  {chat.toType && (
                    <span className={styles.chatType}>{getChatType(chat)}</span>
                  )}
                </div>
                <span className={styles.chatTime}>{getLastMessageTime(chat)}</span>
              </div>
              <div className={styles.lastMessage}>
                <span className={styles.messagePreview}>
                  {getLastMessagePreview(chat)}
                </span>
                <div className={styles.messageStatus}>
                  {showUnreadIndicator(chat) && (
                    <span className={styles.unreadDot} />
                  )}
                  {typeof chat.last_message !== 'string' && isLastMessageFromMe(chat) && (
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
          </div>
        ))
      )}
    </div>
  );
};

export default ChatList;