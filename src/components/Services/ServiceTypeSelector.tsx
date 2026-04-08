'use client';

import React from 'react';
import styles from './ServiceTypeSelector.module.scss';
import {
  Coffee, Cake, TrendingUp, DollarSign, BarChart3,
  Croissant, Salad, Soup, UtensilsCrossed, Wrench, Snowflake, Heater, Thermometer, Coins,
} from 'lucide-react';

export interface ServiceType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ServiceTypeSelectorProps {
  onSelectType: (typeId: string) => void;
}

const serviceTypes: ServiceType[] = [
  {
    id: 'repairs',
    title: 'Ремонт',
    description: 'Ремонт',
    icon: <Wrench size={32} />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
  },
  {
    id: 'coffeeMakers',
    title: 'Кофемашины',
    description: 'Кофемашины',
    icon: <Coffee size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
  {
    id: 'fridges',
    title: 'Холодильники-Витрины',
    description: 'Холодильники и Витрины',
    icon: <Snowflake  size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'kitchen',
    title: 'Печи-Кухня',
    description: 'Печи и Кухня',
    icon: <Heater size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'climate',
    title: 'Климат',
    description: 'Климат',
    icon: <Thermometer  size={32} />,
    color: '#ff5722',
    bgColor: '#fbe9e7',
  },
  {
    id: 'cashRegisters',
    title: 'Кассы',
    description: 'Кассы',
    icon: <Coins size={32} />,
    color: '#795548',
    bgColor: '#efebe9',
  },
];

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Услуги</h1>
        <p>Выберите тип ремонтных работ</p>
      </div>
      <div className={styles.grid}>
        {serviceTypes.map(type => (
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

export default ServiceTypeSelector;