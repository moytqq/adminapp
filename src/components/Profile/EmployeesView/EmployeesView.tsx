'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadAllPositions,
} from '@/store/slices/personalSlice';
import { loadStores } from '@/store/slices/addressSlice';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddPositionModal from '@/components/StaffPage/AddPositionModal';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';
import styles from './EmployeesView.module.scss';
import { Users, Briefcase, RefreshCw, ArrowUpDown } from 'lucide-react';

type SortOrder = 'asc' | 'desc';

const EmployeesView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { positions, staff, loading: personalLoading } = useAppSelector((state) => state.personal);
  const { stores, loading: addressLoading } = useAppSelector((state) => state.address);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [storeNamesMap, setStoreNamesMap] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        dispatch(loadAllStaff()),
        dispatch(loadAllPositions()),
        dispatch(loadStores()),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (stores.length > 0) {
      const map: Record<string, string> = {};
      stores.forEach(store => {
        map[store.hid] = store.address ? `${store.name} (${store.address})` : store.name;
      });
      setStoreNamesMap(map);
    }
  }, [stores]);

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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedPositions = [...positions].sort((a, b) => {
    if (a.lsid === null && b.lsid !== null) return -1;
    if (a.lsid !== null && b.lsid === null) return 1;

    const comparison = a.name.localeCompare(b.name);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const vacantPositions = positions.filter(p => p.lsid === null);
  const occupiedPositions = positions.filter(p => p.lsid !== null);

  const isLoading = initialLoading || personalLoading || addressLoading || isRefreshing;

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
            className={`${styles.sortButton} ${sortOrder === 'desc' ? styles.desc : ''}`}
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'Сортировка по возрастанию' : 'Сортировка по убыванию'}
          >
            <ArrowUpDown size={16} />
            <span>Сортировка</span>
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
              const storeDisplayName = storeNamesMap[position.hid] || 'Магазин';

              return (
                <PositionCard
                  key={position.id}
                  position={position}
                  staff={assignedStaff}
                  allStaff={staff}
                  storeName={storeDisplayName}
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