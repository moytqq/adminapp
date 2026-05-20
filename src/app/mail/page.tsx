'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import { Menu } from 'lucide-react';
import styles from './mail.module.scss';
import stylesSideMenu from '@/app/main/main.module.scss';
import { useAccess } from '@/store/hooks/useAccess';
import PageTitle from '@/components/PageTitle/PageTitle';

const MailPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hasFlag } = useAccess();

  const iframeSrc = hasFlag(['MAIL_SSO']) ? '/api/mail-auth' : '/roundcube/';

  return (
    <ProtectedRoute requiredFlags={['MAIL', 'ADMIN']} redirectTo="/main">
      <PageTitle title="Почта" />
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
            <h1 className={styles.title}>Почта</h1>
          </div>
        </header>

        <main className={styles.content}>
          <iframe
            src={iframeSrc}
            className={styles.iframe}
            title="Roundcube Webmail"
            allow="clipboard-read; clipboard-write"
          />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MailPage;
