'use client';

import React from 'react';
import styles from './AutoOrderTypeSelector.module.scss';
import {
  Coffee,
  Cake,
  TrendingUp,
  DollarSign,
  BarChart3,
  Croissant,
  Salad,
  Soup,
  UtensilsCrossed,
  Wrench,
  Snowflake,
  Heater,
  Thermometer,
  Coins,
  Table,
  ShoppingCart,
  CalendarCheck, CalendarSync, CalendarClock, CalendarCheck2,
} from 'lucide-react';

export interface AutoOrderType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface AutoOrderTypeSelectorProps {
  onSelectType: (typeId: string) => void;
}

const autoOrderTypes: AutoOrderType[] = [
  {
    id: 'itemsMatrix',
    title: 'Товарная матрица',
    description: 'Товарная матрица',
    icon: <Table size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'nonProfitablePurchases',
    title: 'Некоммерческие закупки',
    description: 'Некоммерческие закупки',
    icon: <ShoppingCart size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  {
    id: 'workInProgress',
    title: 'В работе',
    description: 'В работе',
    icon: <CalendarSync  size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'completed',
    title: 'Выполнены',
    description: 'Выполнены',
    icon: <CalendarCheck2 size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'urgentOrder',
    title: 'Срочный заказ',
    description: 'Срочный заказ',
    icon: <CalendarClock  size={32} />,
    color: '#ff5722',
    bgColor: '#fbe9e7',
  },
];

const AutoOrderTypeSelector: React.FC<AutoOrderTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Автозаказы</h1>
        <p>Выберите тип Автозаказа</p>
      </div>
      <div className={styles.grid}>
        {autoOrderTypes.map(type => (
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