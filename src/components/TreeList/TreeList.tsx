'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { loadTreeData, toggleExpand } from '@/store/slices/treeSlice';
import TreeItem from './TreeItem';
import styles from './TreeList.module.scss';
import { RefreshCw } from 'lucide-react';
import ViewModeToggle from '@/components/ViewModeToggle/ViewModeToggle';

const TreeList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error, viewMode } = useAppSelector(
    (state) => state.tree,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const loadData = useCallback(() => {
    dispatch(loadTreeData());
  }, [dispatch]);

  useEffect(() => {
    console.log('TreeList useEffect triggered, viewMode:', viewMode);
    loadData();
  }, [loadData, viewMode]);

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
        return 'Иерархия компании';
      case 'store-departments':
        return 'Магазины и отделы';
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
            <h1>
              {getTitle()}
            </h1>
            {isMobile && (
              <div className={styles.mobileToggleContainer}>
                <ViewModeToggle />
              </div>
            )}
          </div>
          {!isMobile && (
            <div className={styles.actions}>
              <ViewModeToggle />
            </div>)}
        </div>
      </div>

      <div className={styles.treeContainer}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет данных для отображения</p>
            <p className={styles.emptyHint}>
              {viewMode === 'store-departments'
                ? 'В данных не найдено магазинов'
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