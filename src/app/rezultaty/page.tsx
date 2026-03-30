// app/rezultaty/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import ReportsView from '@/components/Reports/ReportsView';
import styles from './rezultaty.module.scss';
import { Menu, ArrowLeft } from 'lucide-react';
import stylesSideMenu from '@/app/main/main.module.scss';

const RezultatyPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProtectedRoute>
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
            <h1 className={styles.title}>Результаты</h1>
          </div>
        </header>

        <main className={styles.content}>
          <ReportsView />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default RezultatyPage;