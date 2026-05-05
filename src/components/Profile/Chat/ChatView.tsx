'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import CreateChatModal from './CreateChatModal';
import styles from './ChatView.module.scss';
import { MessageCircle, Plus } from 'lucide-react';

interface ChatViewProps {
  chatType?: string;
  isInProfile?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({
                                             chatType = 'write',
                                             isInProfile = false
                                           }) => {
  const [selectedChat, setSelectedChat] = useState<number | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const updateChatRef = useRef<((chatId: number, isRead: boolean) => void) | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = useCallback((chatId: number) => {
    setSelectedChat(chatId);
  }, []);

  const handleChatCreated = useCallback(() => {
  }, []);

  const handleMessageSent = useCallback(() => {
  }, []);

  const handleMessageRead = useCallback((chatId: number) => {
    if (updateChatRef.current) {
      updateChatRef.current(chatId, true);
    }
  }, []);

  const handleBackToList = () => {
    setSelectedChat(undefined);
  };

  const setUpdateChatCallback = useCallback((callback: (chatId: number, isRead: boolean) => void) => {
    updateChatRef.current = callback;
  }, []);

  const setRefreshCallback = useCallback((callback: () => void) => {
  }, []);

  const getChatTitle = () => {
    return 'Чаты';
  };

  return (
    <div className={styles.chatView}>
      {!isMobile && (
        <div className={styles.header}>
          <h2>{getChatTitle()}</h2>
          <div className={styles.headerActions}>
            <button
              className={styles.newChatButton}
              onClick={() => setIsCreateModalOpen(true)}
              title="Новый чат"
            >
              <Plus size={20} />
              <span>Новый чат</span>
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={`${styles.chatListColumn} ${selectedChat && isMobile ? styles.hidden : ''}`}>
          {isMobile && (
            <div className={styles.mobileHeader}>
              <h2>{getChatTitle()}</h2>
              <button
                className={styles.newChatButton}
                onClick={() => setIsCreateModalOpen(true)}
                title="Новый чат"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
          <ChatList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChat}
            onUpdateChatCallback={setUpdateChatCallback}
            onRefreshRequest={setRefreshCallback}
          />
        </div>

        <div className={`${styles.chatColumn} ${!selectedChat && isMobile ? styles.hidden : ''}`}>
          {selectedChat ? (
            <ChatMessages
              key={selectedChat}
              chatId={selectedChat}
              onBack={handleBackToList}
              isMobile={isMobile}
              onMessageSent={handleMessageSent}
              onMessageRead={handleMessageRead}
            />
          ) : (
            !isMobile && (
              <div className={styles.emptyChat}>
                <MessageCircle size={64} />
                <h3>Выберите чат</h3>
                <p>Выберите чат из списка слева, чтобы просмотреть сообщения</p>
              </div>
            )
          )}
        </div>
      </div>

      <CreateChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default ChatView;