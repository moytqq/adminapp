// components/ViewModeToggle/ViewModeToggle.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Store } from 'lucide-react';
import styles from './ViewModeToggle.module.scss';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { switchViewMode } from '@/store/slices/treeSlice';
import { TreeViewMode } from '@/types/tree.types';

const ViewModeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.tree.viewMode);
  const loading = useAppSelector((state) => state.tree.loading);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleSwitchView = (mode: TreeViewMode) => {
    if (mode === viewMode || loading) return;
    dispatch(switchViewMode(mode));
  };

  return (
    <div className={`${styles.toggleContainer} ${isMobile === null ? styles.hidden :  isMobile ? styles.mobile : styles.desktop}`}>
      <button
        className={`${styles.toggleButton} ${viewMode === 'hierarchy' ? styles.active : ''}`}
        onClick={() => handleSwitchView('hierarchy')}
        disabled={loading}
        aria-label={isMobile ? "Иерархия" : "Иерархическое отображение"}
        title="Иерархическое отображение"
      >
        <LayoutGrid size={isMobile ? 20 : 18} />
        {!isMobile && <span>Иерархия</span>}
      </button>

      <button
        className={`${styles.toggleButton} ${viewMode === 'store-departments' ? styles.active : ''}`}
        onClick={() => handleSwitchView('store-departments')}
        disabled={loading}
        aria-label={isMobile ? "Магазины" : "Отображение по магазинам и отделам"}
        title="Отображение по магазинам и отделам"
      >
        <Store size={isMobile ? 20 : 18} />
        {!isMobile && <span>Магазины → Отделы</span>}
      </button>
    </div>
  );
};

export default ViewModeToggle;