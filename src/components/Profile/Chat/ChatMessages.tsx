'use client';

import React, { useState, useEffect, useRef } from 'react';
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
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ chatId, onBack, isMobile = false, onMessageSent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInfo, setChatInfo] = useState<{
    chat: ChatDetails;
    userFrom: ChatUser;
    userTo: ChatUser;
  } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getMessages(chatId);
      setMessages(response.data || []);
      setChatInfo({
        chat: response.chat.data,
        userFrom: response.chat.userFrom,
        userTo: response.chat.userTo,
      });
    } catch (err) {
      setError('Ошибка загрузки сообщений');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatId) {
      loadMessages();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatInfo) return;

    setSending(true);
    try {
      await chatApi.sendMessage(chatId, newMessage, chatInfo.chat.hid_from);
      setNewMessage('');
      await loadMessages();
      if (onMessageSent) {
        onMessageSent();
      }
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: ru });
    } catch {
      return timestamp;
    }
  };

  const formatMessageDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'dd MMMM yyyy', { locale: ru });
    } catch {
      return timestamp;
    }
  };

  const getSenderName = (hid: number): string => {
    if (!chatInfo) return 'Неизвестно';
    return hid === chatInfo.chat.hid_from ? chatInfo.userFrom.name : chatInfo.userTo.name;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка сообщений...</p>
      </div>
    );
  }

  if (error) {
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
          <span className={styles.chatType}>
            {chatInfo.userTo.type === 'Person' ? 'Сотрудник' :
              chatInfo.userTo.type === 'Department' ? 'Департамент' : 'Компания'}
          </span>
        </div>
      )}
      <div className={styles.messagesContainer}>
        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <div className={styles.noMessages}>
              <p>Нет сообщений</p>
              <p className={styles.noMessagesHint}>Напишите первое сообщение</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isFromMe = chatInfo && msg.hid === chatInfo.chat.hid_from;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMsg ||
                new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className={styles.dateSeparator}>
                      <span>{formatMessageDate(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className={`${styles.messageWrapper} ${isFromMe ? styles.myMessage : styles.theirMessage}`}>
                    {!isFromMe && (
                      <div className={styles.messageSender}>
                        {getSenderName(msg.hid)}
                      </div>
                    )}
                    <div className={styles.message}>
                      <div className={styles.messageContent}>
                        {msg.message}
                      </div>
                      <div className={styles.messageMeta}>
                      <span className={styles.messageTime}>
                        {formatMessageTime(msg.timestamp)}
                      </span>
                        {isFromMe && (
                          <span className={styles.messageStatus}>
                          {msg.is_readed ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
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
};

export default ChatMessages;