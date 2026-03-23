'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { chatApi, ChatMessage, ChatDetails, ChatUser } from '@/services/chatApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './ChatMessages.module.scss';
import { Send, Check, CheckCheck, ArrowLeft } from 'lucide-react';

interface ChatMessagesProps {
  chatId: number;
  onBack?: () => void;
  isMobile?: boolean;
  onMessageSent?: () => void;
  onMessageRead?: (chatId: number) => void;
}

const MessageItem = memo(({
                            message,
                            isFromMe,
                            senderName,
                            showDate,
                            formattedDate
                          }: {
  message: ChatMessage;
  isFromMe: boolean;
  senderName: string;
  showDate: boolean;
  formattedDate: string;
}) => {
  const messageTime = useMemo(() => {
    try {
      const date = new Date(message.timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return message.timestamp;
    }
  }, [message.timestamp]);

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator}>
          <span>{formattedDate}</span>
        </div>
      )}
      <div className={`${styles.messageWrapper} ${isFromMe ? styles.myMessage : styles.theirMessage}`}>
        {!isFromMe && (
          <div className={styles.messageSender}>
            {senderName}
          </div>
        )}
        <div className={styles.message}>
          <div className={styles.messageContent}>
            {message.message}
          </div>
          <div className={styles.messageMeta}>
            <span className={styles.messageTime}>
              {messageTime}
            </span>
            {isFromMe && (
              <span className={styles.messageStatus}>
                {message.is_readed ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

MessageItem.displayName = 'MessageItem';

const ChatMessages = memo(({
                             chatId,
                             onBack,
                             isMobile = false,
                             onMessageSent,
                             onMessageRead
                           }: ChatMessagesProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState<{
    chat: ChatDetails;
    userFrom: ChatUser;
    userTo: ChatUser;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUserHid, setCurrentUserHid] = useState<number | null>(null);
  const isFirstLoad = useRef(true);
  const lastMessageCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const senders = await chatApi.getSendersList();
        if (senders.length > 0) {
          setCurrentUserHid(senders[0].id);
        }
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };
    loadCurrentUser();
  }, []);

  const loadMessages = useCallback(async () => {
    if (!chatId || !currentUserHid) return;

    try {
      const response = await chatApi.getMessages(chatId);
      const newMessages = response.data || [];

      setMessages(prevMessages => {
        if (prevMessages.length === newMessages.length) {
          let isSame = true;
          for (let i = 0; i < prevMessages.length; i++) {
            const prev = prevMessages[i];
            const curr = newMessages[i];
            if (prev.id !== curr.id || prev.is_readed !== curr.is_readed || prev.message !== curr.message) {
              isSame = false;
              break;
            }
          }
          if (isSame) {
            return prevMessages;
          }
        }
        return newMessages;
      });

      setChatInfo(prev => {
        if (prev &&
          prev.chat.id === response.chat.data.id &&
          prev.userFrom.id === response.chat.userFrom.id &&
          prev.userTo.id === response.chat.userTo.id) {
          return prev;
        }
        return {
          chat: response.chat.data,
          userFrom: response.chat.userFrom,
          userTo: response.chat.userTo,
        };
      });

      setError(null);

      const hasUnreadFromOthers = newMessages.some(
        msg => msg.is_readed === 0 && msg.hid !== currentUserHid
      );
      if (hasUnreadFromOthers && onMessageRead) {
        onMessageRead(chatId);
      }

      isFirstLoad.current = false;
    } catch (err) {
      console.error('Error loading messages:', err);
      if (messages.length === 0 && isFirstLoad.current) {
        setError('Ошибка загрузки сообщений');
        isFirstLoad.current = false;
      }
    }
  }, [chatId, currentUserHid, onMessageRead, messages.length]);

  useEffect(() => {
    if (!chatId || !currentUserHid) return;

    loadMessages();

    intervalRef.current = setInterval(() => {
      if (chatId && currentUserHid && !isFirstLoad.current) {
        loadMessages();
      }
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chatId, currentUserHid, loadMessages]);

  useEffect(() => {
    if (!isFirstLoad.current && messages.length !== lastMessageCountRef.current) {
      scrollToBottom();
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatInfo) return;

    setSending(true);
    try {
      await chatApi.sendMessage(chatId, newMessage, chatInfo.chat.hid_from);
      setNewMessage('');
      await loadMessages();
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [newMessage, chatInfo]);

  const preparedMessages = useMemo(() => {
    let lastDate: string | null = null;

    return messages.map((msg) => {
      const isFromMe = chatInfo ? msg.hid === chatInfo.chat.hid_from : false;
      const currentDate = new Date(msg.timestamp).toDateString();
      const showDate = lastDate !== currentDate;
      lastDate = currentDate;

      return {
        id: msg.id,
        message: msg,
        isFromMe,
        senderName: !isFromMe ? (chatInfo ? (msg.hid === chatInfo.chat.hid_from ? chatInfo.userFrom.name : chatInfo.userTo.name) : '') : '',
        showDate,
        formattedDate: showDate ? (() => {
          try {
            return format(new Date(msg.timestamp), 'dd MMMM yyyy', { locale: ru });
          } catch {
            return msg.timestamp;
          }
        })() : '',
      };
    });
  }, [messages, chatInfo]);

  const messageItems = useMemo(() => {
    return preparedMessages.map((item) => (
      <MessageItem
        key={item.id}
        message={item.message}
        isFromMe={item.isFromMe}
        senderName={item.senderName}
        showDate={item.showDate}
        formattedDate={item.formattedDate}
      />
    ));
  }, [preparedMessages]);

  if (error && messages.length === 0 && !isFirstLoad.current) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadMessages}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.chatMessages}>
      {chatInfo && (
        <div className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            {isMobile && onBack && (
              <button className={styles.backButton} onClick={onBack}>
                <ArrowLeft size={20} />
              </button>
            )}
            <span className={styles.chatWith}>
              {chatInfo.userTo.name}
            </span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.chatType}>
              {chatInfo.userTo.type === 'Person' ? 'Сотрудник' :
                chatInfo.userTo.type === 'Department' ? 'Департамент' : 'Компания'}
            </span>
          </div>
        </div>
      )}
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.length === 0 && !isFirstLoad.current ? (
            <div className={styles.noMessages}>
              <p>Нет сообщений</p>
              <p className={styles.noMessagesHint}>Напишите первое сообщение</p>
            </div>
          ) : (
            messageItems
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className={styles.messageInput}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;