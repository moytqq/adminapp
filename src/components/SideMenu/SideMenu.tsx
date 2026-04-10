'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  X,
  Users,
  Building2,
  Text,
  FileText,
  ClipboardCheck,
  MessageCircle,
  MessageCircleMore, Lightbulb, Star, ListOrdered, User, Wrench,
} from 'lucide-react';
import styles from './SideMenu.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton/LogoutButton';

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
            href="/main"
            className={`${styles.navItem} ${pathname === '/main' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <Building2 size={20} />
            <span>Компания</span>
          </Link>
          <Link
            href="/profile"
            className={`${styles.navItem} ${pathname === '/profile' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <User size={20} />
            <span>Личный кабинет</span>
          </Link>
          <Link
            href="/autoOrders"
            className={`${styles.navItem} ${pathname === '/autoOrders' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <ListOrdered  size={20} />
            <span>Автозаказы</span>
          </Link>
          <Link
            href="/staff"
            className={`${styles.navItem} ${pathname === '/staff' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <Users size={20} />
            <span>Сотрудники</span>
          </Link>
          <Link
            href="/planner"
            className={`${styles.navItem} ${pathname === '/planner' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <ClipboardCheck size={20} />
            <span>Планировщик</span>
          </Link>
          <Link
            href="/results"
            className={`${styles.navItem} ${pathname === '/results' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <FileText size={20} />
            <span>Результаты</span>
          </Link>
          <Link
            href="/services"
            className={`${styles.navItem} ${pathname === '/services' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <Wrench size={20} />
            <span>Сервис</span>
          </Link>
          <Link
            href="/chat"
            className={`${styles.navItem} ${pathname === '/chat' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <MessageCircleMore size={20} />
            <span>Чат</span>
          </Link>
          <Link
            href="/proposes"
            className={`${styles.navItem} ${pathname === '/proposes' ? styles.active : ''}`}
            onClick={handleLinkClick}
          >
            <Lightbulb size={20} />
            <span>Предложения</span>
          </Link>
        </nav>
        <footer className={styles.footer}>
          <LogoutButton/>
        </footer>
      </div>
    </>,
    document.body
  );
};

export default SideMenu;