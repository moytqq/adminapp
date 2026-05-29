'use client';

import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { ChatListItem, chatApi, ChatUser } from '@/services/chatApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './ChatList.module.scss';
import { MessageCircle, Check, CheckCheck } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar/UserAvatar';

interface ChatListProps {
  onSelectChat: (chatId: number) => void;
  selectedChatId?: number;
  onUpdateChatCallback?: (callback: (chatId: number, isRead: boolean) => void) => void;
  onRefreshRequest?: (callback: () => void) => void;
}

interface ChatWithNames extends ChatListItem {
  fromName?: string;
  toName?: string;
  fromType?: string;
  toType?: string;
}

const ChatItem = memo(({
                         chat,
                         isSelected,
                         onSelect,
                         currentUserHid
                       }: {
  chat: ChatWithNames;
  isSelected: boolean;
  onSelect: (id: number) => void;
  currentUserHid: number | null;
}) => {
  const chatName = chat.toName || `Чат #${chat.id}`;
  const chatType = chat.toType ?
    (chat.toType === 'Person' ? 'Сотрудник' :
      chat.toType === 'Department' ? 'Департамент' : 'Компания') : '';

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = () => {
    const text = typeof chat.last_message === 'string'
      ? chat.last_message
      : (chat.last_message.message || '');

    if (/<attachment/.test(text)) {
      const nameMatch = text.match(/name="([^"]+)"/);
      const ext = nameMatch?.[1].split('.').pop()?.toLowerCase() ?? '';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '📷 Фото';
      return '📎 Вложение';
    }
    return text;
  };

  const getLastMessageTime = () => {
    if (typeof chat.last_message === 'string') return '';
    return formatMessageTime(chat.last_message.timestamp);
  };

  const isLastMessageFromMe = () => {
    if (typeof chat.last_message === 'string' || !currentUserHid) return false;
    return chat.last_message.hid === currentUserHid;
  };

  const isLastMessageRead = () => {
    if (typeof chat.last_message === 'string') return false;
    return chat.last_message.is_readed === 1;
  };

  const showUnreadIndicator = () => {
    if (typeof chat.last_message === 'string' || !currentUserHid) return false;
    return !isLastMessageFromMe() && !isLastMessageRead();
  };

  return (
    <div
      className={`${styles.chatItem} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(chat.id)}
    >
      <div className={styles.chatAvatar}>
        <UserAvatar hid={chat.hid_to} name={chat.toName ?? ''} size={40} />
      </div>
      <div className={styles.chatInfo}>
        <div className={styles.chatHeader}>
          <div className={styles.chatNameContainer}>
            <span className={styles.chatName}>{chatName}</span>
            {chat.toType && (
              <span className={styles.chatType}>{chatType}</span>
            )}
          </div>
          <span className={styles.chatTime}>{getLastMessageTime()}</span>
        </div>
        <div className={styles.lastMessage}>
          <span className={styles.messagePreview}>
            {getLastMessagePreview()}
          </span>
          <div className={styles.messageStatus}>
            {showUnreadIndicator() && (
              <span className={styles.unreadDot} />
            )}
            {typeof chat.last_message !== 'string' && isLastMessageFromMe() && (
              <span className={styles.readStatus}>
                {isLastMessageRead() ? (
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
  );
});

ChatItem.displayName = 'ChatItem';

const ChatList: React.FC<ChatListProps> = ({
                                             onSelectChat,
                                             selectedChatId,
                                             onUpdateChatCallback,
                                             onRefreshRequest,
                                           }) => {
  const [chats, setChats] = useState<ChatWithNames[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Map<number, ChatUser>>(new Map());
  const [currentUserHid, setCurrentUserHid] = useState<number | null>(null);
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const updateChats = useCallback(async () => {
    if (!currentUserHid) return;

    try {
      const chatList = await chatApi.getChatList();

      const newChatsMap = new Map<number, ChatWithNames>();
      chatList.forEach(chat => {
        const fromUser = usersMap.get(chat.hid_from);
        const toUser = usersMap.get(chat.hid_to);

        newChatsMap.set(chat.id, {
          ...chat,
          fromName: fromUser?.name,
          toName: toUser?.name,
          fromType: fromUser?.type,
          toType: toUser?.type,
        });
      });

      setError(null);

      setChats(prevChats => {
        if (prevChats.length === 0) {
          return Array.from(newChatsMap.values());
        }

        let hasChanges = false;
        const updatedChats = Array.from(newChatsMap.values()).map(newChat => {
          const existingChat = prevChats.find(c => c.id === newChat.id);
          if (existingChat) {
            const existingLastMsg = JSON.stringify(existingChat.last_message);
            const newLastMsg = JSON.stringify(newChat.last_message);
            if (existingLastMsg !== newLastMsg) {
              hasChanges = true;
              return newChat;
            }
            return existingChat;
          }
          hasChanges = true;
          return newChat;
        });

        if (!hasChanges) {
          return prevChats;
        }
        return updatedChats;
      });

      isFirstLoad.current = false;
    } catch (err) {
      console.error('Error loading chats:', err);
      if (chats.length === 0 && isFirstLoad.current) {
        setError('Ошибка загрузки чатов');
        isFirstLoad.current = false;
      }
    }
  }, [usersMap, currentUserHid, chats.length]);

  useEffect(() => {
    if (onRefreshRequest) {
      onRefreshRequest(updateChats);
    }
  }, [onRefreshRequest, updateChats]);

  useEffect(() => {
    if (!currentUserHid) return;

    updateChats();

    intervalRef.current = setInterval(() => {
      if (!isFirstLoad.current) {
        updateChats();
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentUserHid, updateChats]);

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

  if (!isFirstLoad.current && chats.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MessageCircle size={48} />
        <p>У вас пока нет чатов</p>
        <p className={styles.emptyHint}>Создайте новый чат, чтобы начать общение</p>
      </div>
    );
  }

  if (error && chats.length === 0 && !isFirstLoad.current) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={updateChats}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.chatList}>
      {chats.map(chat => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChatId === chat.id}
          onSelect={onSelectChat}
          currentUserHid={currentUserHid}
        />
      ))}
    </div>
  );
};

export default ChatList;