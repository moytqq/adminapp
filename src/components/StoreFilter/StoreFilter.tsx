'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import styles from './StoreFilter.module.scss';

interface StoreFilterProps {
  onFilterChange: (selectedType: string | null) => void;
  isVisible: boolean;
  selectedType?: string | null;
}

const StoreFilter: React.FC<StoreFilterProps> = ({ onFilterChange, isVisible, selectedType: externalSelectedType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(externalSelectedType || null);
  const [isMobile, setIsMobile] = useState(false);

  const storeTypes = ['Колбаса', 'Мясо', 'Молоко'];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (externalSelectedType !== undefined) {
      setSelectedType(externalSelectedType);
    }
  }, [externalSelectedType]);

  const handleTypeSelect = (type: string) => {
    const newType = selectedType === type ? null : type;
    setSelectedType(newType);
    onFilterChange(newType);
    setIsOpen(false);
  };

  const clearFilter = () => {
    setSelectedType(null);
    onFilterChange(null);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.storeFilter}>
      <div className={styles.filterContainer}>
        <button
          className={`${styles.filterButton} ${selectedType ? styles.active : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Фильтр по типу магазина"
        >
          <Filter size={isMobile ? 18 : 16} />
          {selectedType && <span className={styles.selectedBadge}>{selectedType}</span>}
          {!isMobile && <span>Тип магазина</span>}
        </button>

        {selectedType && (
          <button
            className={styles.clearButton}
            onClick={clearFilter}
            title="Сбросить фильтр"
          >
            <X size={isMobile ? 16 : 14} />
          </button>
        )}

        {isOpen && (
          <>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} />
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span>Тип магазина</span>
                <button onClick={() => setIsOpen(false)}>×</button>
              </div>
              <div className={styles.dropdownList}>
                {storeTypes.map(type => (
                  <button
                    key={type}
                    className={`${styles.typeOption} ${selectedType === type ? styles.selected : ''}`}
                    onClick={() => handleTypeSelect(type)}
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
  );
};

export default StoreFilter;