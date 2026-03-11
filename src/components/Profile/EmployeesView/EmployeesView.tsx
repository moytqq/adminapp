'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadAllPositions,
} from '@/store/slices/personalSlice';
import { loadTreeData } from '@/store/slices/treeSlice';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddPositionModal from '@/components/StaffPage/AddPositionModal';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';
import styles from './EmployeesView.module.scss';
import { Users, Briefcase, RefreshCw } from 'lucide-react';
import { TreeItemType } from '@/types/tree.types';

const EmployeesView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { positions, staff, loading: personalLoading } = useAppSelector((state) => state.personal);
  const { items: treeItems, loading: treeLoading } = useAppSelector((state) => state.tree);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [storeNamesMap, setStoreNamesMap] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        dispatch(loadTreeData()),
        dispatch(loadAllStaff()),
        dispatch(loadAllPositions()),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const extractStoreNames = (items: any[]): Record<string, string> => {
      const map: Record<string, string> = {};

      const traverse = (items: any[]) => {
        items.forEach(item => {
          if (item.type === TreeItemType.STORE) {
            const match = item.id.match(/\d+$/);
            const hid = match ? match[0] : item.id;
            map[hid] = item.label || item.data?.storeName || 'Магазин';
          }
          if (item.children) {
            traverse(item.children);
          }
        });
      };

      traverse(items);
      return map;
    };

    if (treeItems && treeItems.length > 0) {
      setStoreNamesMap(extractStoreNames(treeItems));
    }
  }, [treeItems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedPositions = [...positions].sort((a, b) => {
    if (a.lsid === null && b.lsid !== null) return -1;
    if (a.lsid !== null && b.lsid === null) return 1;
    return a.name.localeCompare(b.name);
  });

  const vacantPositions = positions.filter(p => p.lsid === null);
  const occupiedPositions = positions.filter(p => p.lsid !== null);

  const isLoading = initialLoading || personalLoading || treeLoading || isRefreshing;

  return (
    <div className={styles.employeesView}>
      <div className={styles.header}>
        <h2>Сотрудники и вакансии</h2>
        <div className={styles.headerActions}>
          <button
            onClick={handleRefresh}
            className={`${styles.refreshButton} ${isRefreshing ? styles.refreshing : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spin : ''} />
            <span>Обновить</span>
          </button>
          <button
            className={styles.addButton}
            onClick={() => setShowAddPositionModal(true)}
          >
            <Briefcase size={16} />
            <span>Добавить вакансию</span>
          </button>
          <button
            className={styles.addButton}
            onClick={() => setShowAddStaffModal(true)}
          >
            <Users size={16} />
            <span>Добавить сотрудника</span>
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{positions.length}</div>
          <div className={styles.statLabel}>Всего вакансий</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{vacantPositions.length}</div>
          <div className={styles.statLabel}>Свободных</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{occupiedPositions.length}</div>
          <div className={styles.statLabel}>Занятых</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{staff.length}</div>
          <div className={styles.statLabel}>Сотрудников</div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <div className={styles.positionsGrid}>
          {sortedPositions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нет вакансий</p>
              <button
                className={styles.addButton}
                onClick={() => setShowAddPositionModal(true)}
              >
                Добавить первую вакансию
              </button>
            </div>
          ) : (
            sortedPositions.map((position) => {
              const assignedStaff = staff.find(s => s.lsid === position.lsid);
              return (
                <PositionCard
                  key={position.id}
                  position={position}
                  staff={assignedStaff}
                  allStaff={staff}
                  storeName={storeNamesMap[position.hid]}
                />
              );
            })
          )}
        </div>
      )}

      <AddPositionModal
        isOpen={showAddPositionModal}
        onClose={() => setShowAddPositionModal(false)}
      />

      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
      />
    </div>
  );
};

export default EmployeesView;