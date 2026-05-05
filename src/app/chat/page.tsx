'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ChatView from '@/components/Profile/Chat/ChatView';
import styles from './chat.module.scss';
import { Menu } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const ChatPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
            <h1 className={styles.title}>Чат</h1>
          </div>
        </header>

        <main className={styles.content}>
          <ChatView />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ChatPage;