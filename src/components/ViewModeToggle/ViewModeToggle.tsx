'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, MapPin, Filter, X, Building2 } from 'lucide-react';
import styles from './ViewModeToggle.module.scss';
import { useAppDispatch, useAppSelector } from '@/store/hooks/hooks';
import { switchViewMode, setStoreFilter } from '@/store/slices/treeSlice';
import { TreeViewMode } from '@/types/tree.types';

const ViewModeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector((state) => state.tree.viewMode);
  const storeFilter = useAppSelector((state) => state.tree.storeFilter);
  const loading = useAppSelector((state) => state.tree.loading);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const storeTypes = ['Колбаса', 'Мясо', 'Молоко'];

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

  const handleFilterSelect = (type: string) => {
    const newFilter = storeFilter === type ? null : type;
    dispatch(setStoreFilter(newFilter));
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    dispatch(setStoreFilter(null));
    setIsFilterOpen(false);
  };

  const isAddressMode = viewMode === 'addresses';

  if (isMobile === null) return null;

  return (
    <div>
      <div className={`${styles.container} ${isMobile ? styles.mobile : styles.desktop}`}>
        <div className={styles.toggleGroup}>
          {isAddressMode && (
            <div className={styles.filterWrapper}>
              <div className={styles.filterContainer}>
                <button
                  className={`${styles.filterButton} ${storeFilter ? styles.active : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  disabled={loading}
                  aria-label="Фильтр по типу магазина"
                  title="Фильтр по типу магазина"
                >
                  <Filter size={isMobile ? 18 : 16} />
                  {!isMobile && <span>Фильтр</span>}
                </button>
                {storeFilter && !isMobile && (
                  <button
                    className={styles.filterBadge}
                    onClick={() => handleFilterSelect(storeFilter)}>
                    {storeFilter} x
                  </button>
                )}

                {isFilterOpen && (
                  <>
                    <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)} />
                    <div className={styles.filterDropdown}>
                      <div className={styles.dropdownHeader}>
                        <span>Тип магазина</span>
                        <button onClick={() => setIsFilterOpen(false)}>×</button>
                      </div>
                      <div className={styles.dropdownList}>
                        {storeTypes.map(type => (
                          <button
                            key={type}
                            className={`${styles.typeOption} ${storeFilter === type ? styles.selected : ''}`}
                            onClick={() => handleFilterSelect(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            className={`${styles.toggleButton} ${viewMode === 'hierarchy' ? styles.active : ''}`}
            onClick={() => handleSwitchView('hierarchy')}
            disabled={loading}
            aria-label={isMobile ? 'Компания' : 'Иерархическое отображение'}
            title="Иерархическое отображение"
          >
            <Building2 size={isMobile ? 20 : 18} />
            {!isMobile && <span>Компания</span>}
          </button>

          <button
            className={`${styles.toggleButton} ${viewMode === 'departments' ? styles.active : ''}`}
            onClick={() => handleSwitchView('departments')}
            disabled={loading}
            aria-label={isMobile ? 'Департаменты' : 'Отображение департаментов'}
            title="Отображение департаментов"
          >
            <LayoutGrid size={isMobile ? 20 : 18} />
            {!isMobile && <span>Департаменты</span>}
          </button>

          <button
            className={`${styles.toggleButton} ${viewMode === 'addresses' ? styles.active : ''}`}
            onClick={() => handleSwitchView('addresses')}
            disabled={loading}
            aria-label={isMobile ? 'Адреса' : 'Отображение по адресам'}
            title="Отображение по адресам"
          >
            <MapPin size={isMobile ? 20 : 18} />
            {!isMobile && <span>Адреса</span>}
          </button>
        </div>
      </div>
      {isAddressMode && storeFilter && isMobile && (
        <div className={styles.mobileFilterIndicator}>
          <button
            className={styles.mobileFilterBadge}
            onClick={() => handleFilterSelect(storeFilter)}>{storeFilter} x
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ViewModeToggle);