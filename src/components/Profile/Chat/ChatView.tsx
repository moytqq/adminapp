'use client';

import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatMessages from './ChatMessages';
import CreateChatModal from './CreateChatModal';
import styles from './ChatView.module.scss';
import { MessageCircle, Plus } from 'lucide-react';

const ChatView: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<number | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSelectChat = (chatId: number) => {
    setSelectedChat(chatId);
  };

  const handleChatCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBackToList = () => {
    setSelectedChat(undefined);
  };

  return (
    <div className={styles.chatView}>
      {!isMobile && (
        <div className={styles.header}>
          <h2>Чаты</h2>
          <button
            className={styles.newChatButton}
            onClick={() => setIsCreateModalOpen(true)}
            title="Новый чат"
          >
            <Plus size={20} />
            <span>Новый чат</span>
          </button>
        </div>
      )}

      <div className={styles.content}>
        <div className={`${styles.chatListColumn} ${selectedChat && isMobile ? styles.hidden : ''}`}>
          {isMobile && (
            <div className={styles.mobileHeader}>
              <h2>Чаты</h2>
              <button
                className={styles.newChatButton}
                onClick={() => setIsCreateModalOpen(true)}
                title="Новый чат"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
          <ChatList key={refreshKey} onSelectChat={handleSelectChat} selectedChatId={selectedChat} />
        </div>

        <div className={`${styles.chatColumn} ${!selectedChat && isMobile ? styles.hidden : ''}`}>
          {selectedChat ? (
            <ChatMessages
              key={selectedChat}
              chatId={selectedChat}
              onBack={handleBackToList}
              isMobile={isMobile}
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