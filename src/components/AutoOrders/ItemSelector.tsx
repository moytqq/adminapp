// components/AutoOrders/ItemSelector.tsx
'use client';

import React from 'react';
import styles from './ItemSelector.module.scss';
import { ArrowLeft } from 'lucide-react';

export interface SelectorItem {
  id: number | string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

interface ItemSelectorProps {
  title: string;
  subtitle: string;
  items: SelectorItem[];
  onSelect: (item: SelectorItem) => void;
  loading?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({
                                                     title,
                                                     subtitle,
                                                     items,
                                                     onSelect,
                                                     loading,
                                                     onBack,
                                                     showBackButton = false
                                                   }) => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Нет доступных данных</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {showBackButton && onBack && (
          <button className="typeSelectorBackButtonWhite" onClick={onBack} title="Назад к месяцам">
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
        )}
      </div>
      <div className={styles.grid}>
        {items.map(item => (
          <button
            key={item.id}
            className={styles.card}
            onClick={() => onSelect(item)}
          >
            {item.icon && <div className={styles.iconWrapper}>{item.icon}</div>}
            <h3 className={styles.title}>{item.name}</h3>
            {item.description && <p className={styles.description}>{item.description}</p>}
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ItemSelector;