'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Users } from 'lucide-react';
import styles from './SideMenu.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Меню</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <Link
            href="/staff"
            className={`${styles.navItem} ${pathname === '/staff' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <Users size={20} />
            <span>Сотрудники и позиции</span>
          </Link>
        </nav>
      </div>
    </>,
    document.body
  );
};

export default SideMenu;