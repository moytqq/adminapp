'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import styles from './AutoOrderTypeSelector.module.scss';
import {
  Table,
  ShoppingCart,
  CalendarSync,
  CalendarCheck2,
  CalendarClock,
  Truck,
  FlaskConical,
} from 'lucide-react';

export interface AutoOrderType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  requiredFlags?: string[];
}

interface AutoOrderTypeSelectorProps {
  onSelectType: (typeId: string) => void;
}

const allAutoOrderTypes: AutoOrderType[] = [
  {
    id: 'itemsMatrix',
    title: 'Товарная матрица',
    description: 'Товарная матрица',
    icon: <Table size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
    requiredFlags: ['TM_AUTOZAKAZI', 'ADMIN'],
  },
  {
    id: 'suppliers',
    title: 'Поставщики',
    description: 'Настройки поставщиков',
    icon: <Truck size={32} />,
    color: '#00897b',
    bgColor: '#e0f2f1',
    requiredFlags: ['TM_AUTOZAKAZI', 'ADMIN'],
  },
  {
    id: 'ttk',
    title: 'ТТК',
    description: 'Матрица расхода ингредиентов',
    icon: <FlaskConical size={32} />,
    color: '#6d4c41',
    bgColor: '#efebe9',
    requiredFlags: ['TM_AUTOZAKAZI', 'ADMIN'],
  },
  {
    id: 'nonProfitablePurchases',
    title: 'Некоммерческие закупки',
    description: 'Некоммерческие закупки',
    icon: <ShoppingCart size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    requiredFlags: ['ADMIN'],
  },
  {
    id: 'workInProgress',
    title: 'В работе',
    description: 'В работе',
    icon: <CalendarSync size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
    requiredFlags: ['TM_AUTOZAKAZI', 'ADMIN'],
  },
  {
    id: 'completed',
    title: 'Выполнены',
    description: 'Выполнены',
    icon: <CalendarCheck2 size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
    requiredFlags: ['ADMIN'],
  },
  {
    id: 'urgentOrder',
    title: 'Срочный заказ',
    description: 'Срочный заказ',
    icon: <CalendarClock size={32} />,
    color: '#ff5722',
    bgColor: '#fbe9e7',
    requiredFlags: ['ADMIN'],
  },
];

const AutoOrderTypeSelector: React.FC<AutoOrderTypeSelectorProps> = ({ onSelectType }) => {
  const { flags } = useSelector((state: RootState) => state.auth);

  const hasAccessToType = (requiredFlags?: string[]): boolean => {
    if (!requiredFlags || requiredFlags.length === 0) return true;
    if (flags.includes('ADMIN')) return true;
    return requiredFlags.some(flag => flags.includes(flag));
  };

  const visibleTypes = allAutoOrderTypes.filter(type => hasAccessToType(type.requiredFlags));

  console.log('AutoOrderTypeSelector - user flags:', flags);
  console.log('Visible types:', visibleTypes.map(t => t.title));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Автозаказы</h1>
        <p>Выберите тип Автозаказа</p>
      </div>
      <div className={styles.grid}>
        {visibleTypes.map(type => (
          <button
            key={type.id}
            className={styles.card}
            onClick={() => onSelectType(type.id)}
            style={{ backgroundColor: type.bgColor }}
          >
            <div className={styles.iconWrapper} style={{ color: type.color }}>
              {type.icon}
            </div>
            <h3 className={styles.title}>{type.title}</h3>
            <p className={styles.description}>{type.description}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AutoOrderTypeSelector;