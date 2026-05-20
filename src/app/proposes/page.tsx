'use client';

import React, { useState } from 'react';
import SideMenu from '@/components/SideMenu/SideMenu';
import Proposes from '@/components/Proposes/Proposes';
import styles from './proposes.module.scss';
import stylesSideMenu from '@/app/main/main.module.scss';
import { Menu } from 'lucide-react';
import PageTitle from '@/components/PageTitle/PageTitle';

const ProposesPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <PageTitle title="Предложения" />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className={styles.container}>
        <header className={styles.header}>
          <button
            className={stylesSideMenu.menuButton}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu size={24} />
          </button>
          <h1 className={styles.title}>Предложения</h1>
        </header>
        <main className={styles.content}>
          <Proposes />
        </main>
      </div>
    </>
  );
};

export default ProposesPage;
