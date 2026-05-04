'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ChatView from '@/components/Profile/Chat/ChatView';
import ChatCategorySelector from '@/components/Profile/Chat/ChatCategorySelector';
import styles from './chat.module.scss';
import { ArrowLeft, Menu } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const ChatPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatType, setChatType] = useState<string | null>(null);
  const router = useRouter();

  const handleBack = () => {
    if (chatType) {
      setChatType(null);
    } else {
      router.push('/main');
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setChatType(categoryId);
  };

  const getHeaderTitle = () => {
    if (chatType) {
      const categoryTitles: Record<string, string> = {
        write: 'Написать',
        groups: 'Группы',
        team: 'Команда',
        sos: 'SOS',
      };
      return categoryTitles[chatType] || 'Чат';
    }
    return 'Чат';
  };

  const showBackButton = chatType !== null;

  return (
    <ProtectedRoute requiredFlags={['CHAT', 'ADMIN']} redirectTo="/main">
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={stylesSideMenu.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            {!chatType && <h1 className={styles.title}>{getHeaderTitle()}</h1>}
          </div>
        </header>

        <main className={styles.content}>
          {!chatType ? (
            <ChatCategorySelector onSelectCategory={handleSelectCategory} />
          ) : (
            <ChatView chatType={chatType} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ChatPage;