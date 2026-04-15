'use client';

import React from 'react';
import styles from './MonthSelector.module.scss';
import { Calendar } from 'lucide-react';

export interface OrderMonth {
  id: number;
  name: string;
  orderId: string;
  startDay: string;
  endDay: string;
}

interface MonthSelectorProps {
  months: OrderMonth[];
  onSelectMonth: (month: OrderMonth) => void;
  loading?: boolean;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ months, onSelectMonth, loading }) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка месяцев...</p>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className={styles.empty}>
        <Calendar size={48} />
        <p>Нет доступных месяцев</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Выберите месяц</h1>
        <p>Выберите период для просмотра заказов</p>
      </div>
      <div className={styles.grid}>
        {months.map(month => (
          <button
            key={month.id}
            className={styles.card}
            onClick={() => onSelectMonth(month)}
          >
            <div className={styles.iconWrapper}>
              <Calendar size={32} />
            </div>
            <h3 className={styles.title}>{month.name}</h3>
            <p className={styles.description}>
              {new Date(month.startDay).toLocaleDateString('ru-RU')} - {new Date(month.endDay).toLocaleDateString('ru-RU')}
            </p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthSelector;