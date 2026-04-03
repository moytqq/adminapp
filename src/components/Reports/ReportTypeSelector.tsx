'use client';

import React from 'react';
import styles from './ReportTypeSelector.module.scss';
import { Coffee, Cake, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ReportTypeSelectorProps {
  onSelectType: (typeId: string) => void;
}

const reportTypes: ReportType[] = [
  {
    id: 'drinks',
    title: 'Напитки',
    description: 'Анализ продаж кофе, чая и других напитков',
    icon: <Coffee size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'desserts',
    title: 'Десерты',
    description: 'Анализ продаж десертов и выпечки',
    icon: <Cake size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  // {
  //   id: 'sales',
  //   title: 'Общие продажи',
  //   description: 'Анализ общих продаж по всем категориям',
  //   icon: <TrendingUp size={32} />,
  //   color: '#4caf50',
  //   bgColor: '#e8f5e9',
  // },
];

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Отчеты</h1>
        <p>Выберите тип отчета для анализа продаж</p>
      </div>
      <div className={styles.grid}>
        {reportTypes.map(type => (
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

export default ReportTypeSelector;