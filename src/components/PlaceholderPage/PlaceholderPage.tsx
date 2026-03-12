// components/PlaceholderPage/PlaceholderPage.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Menu } from 'lucide-react';
import styles from './PlaceholderPage.module.scss';
import SideMenu from '@/components/SideMenu/SideMenu';
import stylesSideMenu from '@/app/main/main.module.scss';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
                                                           title,
                                                           description,
                                                           icon,
                                                           color = '#2196f3',
                                                         }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.push('/main');
  };

  return (
    <>
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
          </div>
          <h1 className={styles.title}>{title}</h1>
        </header>

        <main className={styles.content}>
          <div className={styles.placeholder} style={{ '--accent-color': color } as React.CSSProperties}>
            <div className={styles.iconWrapper} style={{ backgroundColor: `${color}20` }}>
              {icon}
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
            <div className={styles.hint}>
              Этот раздел находится в разработке
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PlaceholderPage;