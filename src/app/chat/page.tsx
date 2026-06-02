'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ChatView from '@/components/Profile/Chat/ChatView';
import PageTitle from '@/components/PageTitle/PageTitle';
import styles from './chat.module.scss';
import { Menu } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const ChatContent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get('chatId');
  const initialChatId = chatIdParam ? parseInt(chatIdParam, 10) : undefined;

  return (
    <ProtectedRoute requiredFlags={['CHAT', 'ADMIN']} redirectTo="/main">
      <PageTitle title="Чат" />
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
            <h1 className={styles.title}>Чат</h1>
          </div>
        </header>

        <main className={styles.content}>
          <ChatView initialChatId={initialChatId} />
        </main>
      </div>
    </ProtectedRoute>
  );
};

const ChatPage = () => (
  <Suspense>
    <ChatContent />
  </Suspense>
);

export default ChatPage;
