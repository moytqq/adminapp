'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadAllPositions,
} from '@/store/slices/personalSlice';
import { loadStores } from '@/store/slices/addressSlice';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddPositionModal from '@/components/StaffPage/AddPositionModal';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';
import Pagination from '@/components/Pagination/Pagination';
import styles from './EmployeesView.module.scss';
import { Users, Briefcase, RefreshCw, ArrowUpDown, Filter, Search } from 'lucide-react';

type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVacant, setFilterVacant] = useState<boolean | null>(null);

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
        map[store.hid] = store.formattedName;
      });
      setStoreNamesMap(map);
    }
  }, [stores]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const toggleFilterVacant = () => {
    setFilterVacant(prev => prev === null ? true : prev === true ? false : null);
    setCurrentPage(1);
  };

  const filteredAndSortedPositions = useMemo(() => {
    let filtered = [...positions];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterVacant !== null) {
      filtered = filtered.filter(p =>
        filterVacant ? p.lsid === null : p.lsid !== null,
      );
    }

    filtered.sort((a, b) => {
      if (a.lsid === null && b.lsid !== null) return -1;
      if (a.lsid !== null && b.lsid === null) return 1;

      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [positions, searchTerm, filterVacant, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedPositions.length / ITEMS_PER_PAGE);
  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPositions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedPositions, currentPage]);

  const vacantPositions = useMemo(() => positions.filter(p => p.lsid === null), [positions]);
  const occupiedPositions = useMemo(() => positions.filter(p => p.lsid !== null), [positions]);

  const getFilterButtonClass = () => {
    if (filterVacant === null) return styles.all;
    if (filterVacant) return styles.vacant;
    return styles.occupied;
  };

  const isLoading = initialLoading || personalLoading || addressLoading || isRefreshing;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className={styles.employeesView}>
      <div className={styles.header}>
        <h2>Сотрудники и вакансии ({filteredAndSortedPositions.length})</h2>
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
            className={`${styles.filterButton} ${getFilterButtonClass()}`}
            onClick={toggleFilterVacant}
            title={
              filterVacant === null ? 'Все вакансии' :
                filterVacant ? 'Только свободные' : 'Только занятые'
            }
          >
            <Filter size={16} />
            <span>{
              filterVacant === null ? 'Все' :
                filterVacant ? 'Свободные' : 'Занятые'
            }</span>
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

      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Поиск по названию вакансии..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          <div className={styles.positionsGrid}>
            {paginatedPositions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Ничего не найдено</p>
                {(searchTerm || filterVacant !== null) && (
                  <button
                    className={styles.resetButton}
                    onClick={() => {
                      setSearchTerm('');
                      setFilterVacant(null);
                    }}
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            ) : (
              paginatedPositions.map((position) => {
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

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          <div className={styles.statsFooter}>
            Показано {paginatedPositions.length} из {filteredAndSortedPositions.length} вакансий
          </div>
        </>
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