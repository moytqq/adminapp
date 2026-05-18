'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import styles from './profile.module.scss';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import PersonalView from '@/components/Profile/Personal/PersonalView';

const ProfilePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            <h1 className={styles.title}>Личный кабинет</h1>
          </div>
        </header>

        <main className={styles.content}>
          <PersonalView />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
