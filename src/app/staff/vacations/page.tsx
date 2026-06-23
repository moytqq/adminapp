'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import VacationsPage from '@/components/VacationsPage/VacationsPage';
import PageTitle from '@/components/PageTitle/PageTitle';
import SideMenu from '@/components/SideMenu/SideMenu';
import { Menu } from 'lucide-react';
import styles from '../staff.module.scss';
import stylesSideMenu from '@/app/main/main.module.scss';

export default function VacationsRoute() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <ProtectedRoute requiredFlags={['ADMIN', 'MANAGER']} redirectTo="/main">
      <PageTitle title="Отпуска" />
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
            <h1 className={styles.title}>Отпуска</h1>
          </div>
        </header>
        <main className={styles.content}>
          <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <VacationsPage onBack={() => router.push('/staff')} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
