'use client';

import React from 'react';
import styles from './ServiceTypeSelector.module.scss';
import {
  Coffee, Wrench, Snowflake, Heater, Thermometer, Coins, Grid2X2, ChefHat,
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
    color: '#795548',
    bgColor: '#efebe9',
  },
  {
    id: 'fridges',
    title: 'Холодильники',
    description: 'Холодильники',
    icon: <Snowflake  size={32} />,
    color: '#216af3',
    bgColor: '#e3eafd',
  },
  {
    id: 'shopWindows',
    title: 'Витрины',
    description: 'Витрины',
    icon: <Grid2X2  size={32} />,
    color: '#ff9800',
    bgColor: '#fff3e0',
  },
  {
    id: 'kitchen',
    title: 'Кухня',
    description: 'Кухня',
    icon: <ChefHat size={32} />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
  },
  {
    id: 'stove',
    title: 'Печи',
    description: 'Печи',
    icon: <Heater size={32} />,
    color: '#d1bc02',
    bgColor: '#f8f5dc',
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
    title: 'Кассы-Орг',
    description: 'Кассы',
    icon: <Coins size={32} />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
  },
];

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Сервис</h1>
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