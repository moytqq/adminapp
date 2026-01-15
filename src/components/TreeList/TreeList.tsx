'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadTreeData, toggleExpand } from '@/store/slices/treeSlice';
import TreeItem from './TreeItem';
import styles from './TreeList.module.scss';
import { RefreshCw } from 'lucide-react';

const TreeList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(
    (state) => state.tree
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(loadTreeData());
    }
  }, [dispatch, items.length]);

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
        <h1>Иерархия компании</h1>
        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${isRefreshing ? styles.refreshing : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            aria-label="Обновить данные"
          >
            <RefreshCw size={18} className={isRefreshing ? styles.spin : ''} />
            <span>{isRefreshing ? 'Обновление...' : 'Обновить'}</span>
          </button>
        </div>
      </div>

      <div className={styles.treeContainer}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет данных для отображения</p>
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

export default TreeList;