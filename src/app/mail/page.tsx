'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import SideMenu from '@/components/SideMenu/SideMenu';
import { Menu } from 'lucide-react';
import styles from './mail.module.scss';
import stylesSideMenu from '@/app/main/main.module.scss';
import { useAccess } from '@/store/hooks/useAccess';

const ROUNDCUBE_URL = process.env.NEXT_PUBLIC_ROUNDCUBE_URL ?? '';

const MailPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hasFlag } = useAccess();

  const iframeSrc = hasFlag(['MAIL_SSO']) ? '/api/mail-auth' : '/api/rc/';

  return (
    <ProtectedRoute requiredFlags={['MAIL', 'ADMIN']} redirectTo="/main">
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
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              className={styles.iframe}
              title="Roundcube Webmail"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <div className={styles.placeholder}>
              <p>URL Roundcube не настроен.</p>
              <p>Задайте переменную <code>NEXT_PUBLIC_ROUNDCUBE_URL</code> в настройках деплоя.</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MailPage;
