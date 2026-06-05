'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import {
  loadAllStaff,
  loadAllPositions,
} from '@/store/slices/personalSlice';
import { loadTreeData } from '@/store/slices/treeSlice';
import { loadStores } from '@/store/slices/addressSlice';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import StaffCategorySelector from '@/components/StaffPage/StaffCategorySelector';
import PositionCard from '@/components/StaffPage/PositionCard';
import AddPositionModal from '@/components/StaffPage/AddPositionModal';
import AddStaffModal from '@/components/StaffPage/AddStaffModal';
import Pagination from '@/components/Pagination/Pagination';
import ManagerLsForm from '@/components/ManagerLsForm/ManagerLsForm';
import { getUserFlags } from '@/services/api';
import styles from './staff.module.scss';
import { Users, Briefcase, Menu, ArrowUpDown, Filter, Search, ArrowLeft } from 'lucide-react';
import { TreeItemType } from '@/types/tree.types';
import SideMenu from '@/components/SideMenu/SideMenu';
import stylesSideMenu from '@/app/main/main.module.scss';
import PageTitle from '@/components/PageTitle/PageTitle';

type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export default function StaffPage() {
  const dispatch = useAppDispatch();
  const { positions, staff, loading: personalLoading } = useAppSelector((state) => state.personal);
  const { items: treeItems } = useAppSelector((state) => state.tree);
  const { stores, loading: addressLoading } = useAppSelector((state) => state.address);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [storeNamesMap, setStoreNamesMap] = useState<Record<string, string>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVacant, setFilterVacant] = useState<boolean | null>(null);
  const [showManagerForm, setShowManagerForm] = useState(false);

  const flags = getUserFlags();
  const hasManagerAccess = flags.includes('MANAGER') || flags.includes('ADMIN');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(loadTreeData()),
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

    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (stores.length > 0) {
      const map: Record<string, string> = {};
      stores.forEach(store => {
        map[store.hid] = store.formattedName;
      });
      setStoreNamesMap(map);
    }
  }, [stores]);

  const handleSelectCategory = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const toggleFilterVacant = () => {
    setFilterVacant(prev => prev === null ? true : prev === true ? false : null);
    setCurrentPage(1);
  };

  const filteredAndSortedPositions = React.useMemo(() => {
    let filtered = [...positions];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterVacant !== null) {
      filtered = filtered.filter(p =>
        filterVacant ? p.lsid === null : p.lsid !== null
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
  const paginatedPositions = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedPositions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedPositions, currentPage]);

  const getFilterButtonClass = () => {
    if (filterVacant === null) return styles.all;
    if (filterVacant) return styles.vacant;
    return styles.occupied;
  };

  const getFilterButtonText = () => {
    if (filterVacant === null) return 'Все';
    if (filterVacant) return 'Свободные';
    return 'Занятые';
  };

  const vacantPositions = positions.filter(p => p.lsid === null);
  const occupiedPositions = positions.filter(p => p.lsid !== null);

  const isLoading = initialLoading || personalLoading || addressLoading;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <ProtectedRoute requiredFlags={['ADMIN', 'MANAGER']} redirectTo="/main">
      <PageTitle title="Линейный персонал" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={stylesSideMenu.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={24} />
            </button>
            {!selectedCategory && <h1 className={styles.title}>Линейный персонал</h1>}
            {selectedCategory && <h1 className={styles.title}>{selectedCategoryName}</h1>}
          </div>
        </header>

        <main className={styles.content}>
          <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

          {!selectedCategory ? (
            <StaffCategorySelector
              onSelectCategory={handleSelectCategory}
              selectedCategory={null}
              onBackToCategories={handleBackToCategories}
              hasManagerAccess={hasManagerAccess}
              onManagerAction={() => setShowManagerForm(true)}
            />
          ) : (
            <>
              <div className={styles.actionsPanel}>
                <button onClick={handleBackToCategories} className={styles.backButton}>
                  <ArrowLeft size={18} />
                  <span>Назад к категориям</span>
                </button>
                <button
                  className={`${styles.sortButton} ${sortOrder === 'desc' ? styles.desc : ''}`}
                  onClick={toggleSortOrder}
                  title={sortOrder === 'asc' ? 'Сортировка по возрастанию' : 'Сортировка по убыванию'}
                >
                  <ArrowUpDown size={18} />
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
                  <span>{getFilterButtonText()}</span>
                </button>
                <button
                  className={styles.addButton}
                  onClick={() => setShowAddPositionModal(true)}
                >
                  <Briefcase size={18} />
                  <span>Добавить вакансию</span>
                </button>
                <button
                  className={styles.addButton}
                  onClick={() => setShowAddStaffModal(true)}
                >
                  <Users size={18} />
                  <span>Добавить сотрудника</span>
                </button>
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
                  <div className={styles.positionsContainer}>
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
                          let storeDisplayName = storeNamesMap[position.hid];

                          if (!storeDisplayName && treeItems.length > 0) {
                            const findStoreInTree = (items: any[]): string | null => {
                              for (const item of items) {
                                const match = item.id.match(/\d+$/);
                                const hid = match ? match[0] : item.id;
                                if (hid === position.hid && item.type === TreeItemType.STORE) {
                                  return item.label || item.data?.storeName || 'Магазин';
                                }
                                if (item.children) {
                                  const found = findStoreInTree(item.children);
                                  if (found) return found;
                                }
                              }
                              return null;
                            };
                            storeDisplayName = findStoreInTree(treeItems) || 'Магазин';
                          }

                          return (
                            <PositionCard
                              key={position.id}
                              position={position}
                              staff={assignedStaff}
                              allStaff={staff}
                              storeName={storeDisplayName || 'Магазин'}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className={styles.footer}>
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
                  </div>
                </>
              )}
            </>
          )}
        </main>

        <AddPositionModal
          isOpen={showAddPositionModal}
          onClose={() => setShowAddPositionModal(false)}
        />

        <AddStaffModal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
        />

        {showManagerForm && (
          <ManagerLsForm onClose={() => setShowManagerForm(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}