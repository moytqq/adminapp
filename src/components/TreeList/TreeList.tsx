'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { loadTreeData, toggleExpand } from '@/store/slices/treeSlice';
import TreeItem from './TreeItem';
import styles from './TreeList.module.scss';
import stylesSideMenu from '@/app/main/main.module.scss';
import { Menu, RefreshCw } from 'lucide-react';
import ViewModeToggle from '@/components/ViewModeToggle/ViewModeToggle';
import SideMenu from '@/components/SideMenu/SideMenu';

const TreeList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error, viewMode, storeFilter } = useAppSelector(
    (state) => state.tree,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadData = useCallback(() => {
    dispatch(loadTreeData());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData, viewMode, storeFilter]);

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

  const handleToggle = (id: string) => {
    dispatch(toggleExpand(id));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(loadTreeData()).unwrap();
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'hierarchy':
        return 'Компания';
      case 'addresses':
        return 'Адреса и магазины';
      default:
        return 'Неизвестный тип отображения';
    }
  };

  if (loading && !isRefreshing) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Ошибка загрузки: {error}</p>
        <button
          onClick={handleRefresh}
          className={styles.retryButton}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Загрузка...' : 'Повторить'}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.treeList}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleSection}>
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <div className={stylesSideMenu.headerLeft}>
              <button
                className={stylesSideMenu.menuButton}
                onClick={() => setIsMenuOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={36} />
              </button>
            </div>
            <h1>{getTitle()}</h1>
          </div>
          <ViewModeToggle />
        </div>
      </div>

      <div className={styles.treeContainer}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Нет данных для отображения</h3>
            <p>
              {viewMode === 'addresses'
                ? storeFilter
                  ? `Нет магазинов типа "${storeFilter}"`
                  : 'В данных не найдено адресов'
                : 'Нет данных для отображения иерархии'
              }
            </p>
            <button
              className={styles.refreshButton}
              onClick={handleRefresh}
            >
              Загрузить данные
            </button>
          </div>
        ) : (
          <div className={styles.treeContent}>
            {items.map((item) => (
              <TreeItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TreeList);