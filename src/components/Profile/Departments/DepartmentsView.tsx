'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { loadTreeData, toggleExpand } from '@/store/slices/treeSlice';
import TreeItem from '@/components/TreeList/TreeItem';
import styles from './DepartmentsView.module.scss';
import { RefreshCw } from 'lucide-react';

const DepartmentsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.tree);
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
        <p>Загрузка департаментов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Ошибка загрузки: {error}</p>
        <button onClick={handleRefresh} className={styles.retryButton}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className={styles.departmentsView}>
      <div className={styles.header}>
        <h2>Департаменты компании</h2>
        <button
          onClick={handleRefresh}
          className={`${styles.refreshButton} ${isRefreshing ? styles.refreshing : ''}`}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? styles.spin : ''} />
          <span>Обновить</span>
        </button>
      </div>

      <div className={styles.treeContainer}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет данных для отображения</p>
            <button onClick={handleRefresh} className={styles.retryButton}>
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

export default DepartmentsView;