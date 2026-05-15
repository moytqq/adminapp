'use client';

import React from 'react';
import { ServiceType } from '@/services/serviceApi';
import styles from './ServiceTypeSelector.module.scss';
import {
  History,
  Wrench,
  Coffee,
  Snowflake,
  Grid2X2,
  ChefHat,
  Heater,
  Thermometer,
  Coins,
} from 'lucide-react';

interface ServiceTypeConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const serviceTypes: ServiceTypeConfig[] = [
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
    icon: <Snowflake size={32} />,
    color: '#216af3',
    bgColor: '#e3eafd',
  },
  {
    id: 'shopWindows',
    title: 'Витрины',
    description: 'Витрины',
    icon: <Grid2X2 size={32} />,
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
    icon: <Thermometer size={32} />,
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

const typeConfigMap = new Map(serviceTypes.map(t => [t.id, t]));

interface ServiceTypeSelectorProps {
  onSelectType: (type: ServiceType) => void;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onSelectType }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Сервис</h1>
        <p>Выберите тип услуги</p>
      </div>
      <div className={styles.grid}>
        {serviceTypes.map(cfg => (
          <button
            key={cfg.id}
            className={styles.card}
            onClick={() => onSelectType({ id: 0, type: cfg.id, name: cfg.title })}
            style={{ backgroundColor: cfg.bgColor }}
          >
            <div className={styles.iconWrapper} style={{ color: cfg.color }}>
              {cfg.icon}
            </div>
            <h3 className={styles.title}>{cfg.title}</h3>
            <p className={styles.description}>{cfg.description}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}

        <button
          className={styles.card}
          onClick={() => onSelectType({ id: -1, type: 'history', name: 'История заявок' })}
          style={{ backgroundColor: '#f5f5f5' }}
        >
          <div className={styles.iconWrapper} style={{ color: '#607d8b' }}>
            <History size={32} />
          </div>
          <h3 className={styles.title}>История заявок</h3>
          <p className={styles.description}>Просмотр всех заявок</p>
          <div className={styles.arrow}>→</div>
        </button>
      </div>
    </div>
  );
};

export { serviceTypes, typeConfigMap };
export type { ServiceTypeConfig };
export default ServiceTypeSelector;