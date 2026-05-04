'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  X,
  Users,
  Building2,
  FileText,
  ClipboardCheck,
  MessageCircleMore,
  Lightbulb,
  ListOrdered,
  User,
  Wrench,
} from 'lucide-react';
import styles from './SideMenu.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton/LogoutButton';
import { useAccess } from '@/store/hooks/useAccess';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 size={20} />,
  User: <User size={20} />,
  ListOrdered: <ListOrdered size={20} />,
  Users: <Users size={20} />,
  ClipboardCheck: <ClipboardCheck size={20} />,
  FileText: <FileText size={20} />,
  Wrench: <Wrench size={20} />,
  MessageCircleMore: <MessageCircleMore size={20} />,
  Lightbulb: <Lightbulb size={20} />,
};

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { getVisibleMenuItems } = useAccess();

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

  const visibleMenuItems = getVisibleMenuItems();

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
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
              onClick={handleLinkClick}
            >
              {iconMap[item.icon]}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <footer className={styles.footer}>
          <LogoutButton />
        </footer>
      </div>
    </>,
    document.body
  );
};

export default SideMenu;