'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { chatApi, ChatMessage, ChatDetails, ChatUser } from '@/services/chatApi';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './ChatMessages.module.scss';
import { Send, Check, CheckCheck, ArrowLeft, Paperclip, X, ImageOff, File } from 'lucide-react';

const FILES_URL = process.env.NEXT_PUBLIC_FILES_URL ?? '';

// ── Attachment helpers ─────────────────────────────────────────────────────

const ATTACHMENT_RE = /<attachment\s+id="([^"]+)"\s+name="([^"]+)"\s*\/>/g;

interface ParsedAttachment {
  id: string;
  name: string;
}

function parseMessage(raw: string): { text: string; attachments: ParsedAttachment[] } {
  const attachments: ParsedAttachment[] = [];
  const text = raw.replace(ATTACHMENT_RE, (_, id, name) => {
    attachments.push({ id, name });
    return '';
  }).trim();
  return { text, attachments };
}

function buildAttachmentTag(id: string, name: string): string {
  return `<attachment id="${id}" name="${name}" />`;
}

// ── AttachmentImage ────────────────────────────────────────────────────────

const AttachmentImage = memo(({ id, name }: { id: string; name: string }) => {
  const [error, setError] = useState(false);
  const src = `${FILES_URL}/files/${id}`;

  if (error) {
    return (
      <div className={styles.attachmentError}>
        <ImageOff size={20} />
        <span>{name}</span>
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noreferrer" className={styles.attachmentLink}>
      <img
        src={src}
        alt={name}
        className={styles.attachmentImg}
        onError={() => setError(true)}
        loading="lazy"
      />
    </a>
  );
});
AttachmentImage.displayName = 'AttachmentImage';

// ── MessageItem ────────────────────────────────────────────────────────────

const MessageItem = memo(({
  message,
  isFromMe,
  senderName,
  showDate,
  formattedDate,
}: {
  message: ChatMessage;
  isFromMe: boolean;
  senderName: string;
  showDate: boolean;
  formattedDate: string;
}) => {
  const messageTime = useMemo(() => {
    try {
      return format(new Date(message.timestamp), 'HH:mm', { locale: ru });
    } catch {
      return message.timestamp;
    }
  }, [message.timestamp]);

  const { text, attachments } = useMemo(() => parseMessage(message.message), [message.message]);

  return (
    <>
      {showDate && (
        <div className={styles.dateSeparator}>
          <span>{formattedDate}</span>
        </div>
      )}
      <div className={`${styles.messageWrapper} ${isFromMe ? styles.myMessage : styles.theirMessage}`}>
        {!isFromMe && <div className={styles.messageSender}>{senderName}</div>}
        <div className={styles.message}>
          {attachments.map(a => (
            <AttachmentImage key={a.id} id={a.id} name={a.name} />
          ))}
          {text && <div className={styles.messageContent}>{text}</div>}
          <div className={styles.messageMeta}>
            <span className={styles.messageTime}>{messageTime}</span>
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

// ── ChatMessages ───────────────────────────────────────────────────────────

interface ChatMessagesProps {
  chatId: number;
  onBack?: () => void;
  isMobile?: boolean;
  onMessageSent?: () => void;
  onMessageRead?: (chatId: number) => void;
}

const ChatMessages = memo(({
  chatId,
  onBack,
  isMobile = false,
  onMessageSent,
  onMessageRead,
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

  // attachment state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null); // только для картинок
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileAnyRef = useRef<HTMLInputElement>(null);

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
        if (senders.length > 0) setCurrentUserHid(senders[0].id);
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
          const isSame = prevMessages.every((prev, i) => {
            const curr = newMessages[i];
            return prev.id === curr.id && prev.is_readed === curr.is_readed && prev.message === curr.message;
          });
          if (isSame) return prevMessages;
        }
        return newMessages;
      });

      setChatInfo(prev => {
        if (
          prev &&
          prev.chat.id === response.chat.data.id &&
          prev.userFrom.id === response.chat.userFrom.id &&
          prev.userTo.id === response.chat.userTo.id
        ) return prev;
        return {
          chat: response.chat.data,
          userFrom: response.chat.userFrom,
          userTo: response.chat.userTo,
        };
      });

      setError(null);

      const hasUnread = newMessages.some(m => m.is_readed === 0 && m.hid !== currentUserHid);
      if (hasUnread && onMessageRead) onMessageRead(chatId);

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
      if (chatId && currentUserHid && !isFirstLoad.current) loadMessages();
    }, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [chatId, currentUserHid, loadMessages]);

  useEffect(() => {
    if (!isFirstLoad.current && messages.length !== lastMessageCountRef.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  // ── File picker ──────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      setPendingPreview(URL.createObjectURL(file));
    } else {
      setPendingPreview(null);
    }
    e.target.value = '';
  };

  const clearPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingFile) || !chatInfo) return;

    setSending(true);
    try {
      let fullMessage = newMessage.trim();

      if (pendingFile) {
        setUploading(true);
        const result = await chatApi.uploadFile(pendingFile);
        setUploading(false);
        if (result.status !== 'success' || !result.fileId) {
          setError(result.message ?? 'Ошибка загрузки файла');
          setSending(false);
          return;
        }
        const tag = buildAttachmentTag(result.fileId, result.originalName ?? pendingFile.name);
        fullMessage = fullMessage ? `${fullMessage}\n${tag}` : tag;
        clearPending();
      }

      await chatApi.sendMessage(chatId, fullMessage, chatInfo.chat.hid_from);
      setNewMessage('');
      await loadMessages();
      inputRef.current?.focus();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [newMessage, chatInfo, pendingFile]);

  // ── Render ───────────────────────────────────────────────────────────────

  const preparedMessages = useMemo(() => {
    let lastDate: string | null = null;
    return messages.map(msg => {
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
          try { return format(new Date(msg.timestamp), 'dd MMMM yyyy', { locale: ru }); }
          catch { return msg.timestamp; }
        })() : '',
      };
    });
  }, [messages, chatInfo]);

  if (error && messages.length === 0 && !isFirstLoad.current) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadMessages}>Повторить</button>
      </div>
    );
  }

  const isBusy = sending || uploading;
  const canSend = (!!newMessage.trim() || !!pendingFile) && !isBusy;

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
            <span className={styles.chatWith}>{chatInfo.userTo.name}</span>
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
            preparedMessages.map(item => (
              <MessageItem
                key={item.id}
                message={item.message}
                isFromMe={item.isFromMe}
                senderName={item.senderName}
                showDate={item.showDate}
                formattedDate={item.formattedDate}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Превью прикреплённого файла */}
      {pendingFile && (
        <div className={styles.pendingAttachment}>
          {pendingPreview
            ? <img src={pendingPreview} alt="preview" className={styles.pendingImg} />
            : <span className={styles.pendingFileName}>📎 {pendingFile.name}</span>
          }
          <button className={styles.removePending} onClick={clearPending} title="Убрать">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.inputArea}>
        {/* Скрытые inputs для файлов */}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        <input ref={fileAnyRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
        <button
          className={styles.attachButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          title="Прикрепить изображение"
        >
          <Paperclip size={20} />
        </button>
        <button
          className={styles.attachButton}
          onClick={() => fileAnyRef.current?.click()}
          disabled={isBusy}
          title="Прикрепить файл"
        >
          <File size={20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          className={styles.messageInput}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isBusy}
        />
        <button
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={!canSend}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
});

ChatMessages.displayName = 'ChatMessages';
export default ChatMessages;
