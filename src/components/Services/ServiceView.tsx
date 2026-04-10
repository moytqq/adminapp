import React from 'react';
import styles from './ServiceView.module.scss';
import {
  Calendar,
  CalendarClock,
  Table,
  ShoppingCart,
  CalendarSync,
  CalendarCheck2,
  Wrench,
  Coffee,
  Snowflake,
  Grid2X2,
  ChefHat,
  Heater,
  Thermometer,
  Coins,
} from 'lucide-react';

interface ServiceViewProps {
  serviceType: string;
  onBack?: () => void;
}

const getServiceTitle = (type: string): string => {
  const titles: Record<string, string> = {
    repairs: 'Ремонт',
    coffeeMakers: 'Кофемашины',
    fridges: 'Холодильники',
    shopWindows: 'Витрины',
    kitchen: 'Кухня',
    stove: 'Печи',
    climate: 'Климат',
    cashRegisters: 'Кассы-Орг',
  };
  return titles[type] || 'Сервис';
};

const getServiceIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    repairs: <Wrench size={48} />,
    coffeeMakers: <Coffee size={48} />,
    fridges: <Snowflake size={48} />,
    shopWindows: <Grid2X2 size={48} />,
    kitchen: <ChefHat size={48} />,
    stove: <Heater size={48} />,
    climate: <Thermometer size={48} />,
    cashRegisters: <Coins size={48} />,
  };
  return icons[type] || <Wrench size={48} />;
};

const ServiceView: React.FC<ServiceViewProps> = ({ serviceType, onBack }) => {
  const title = getServiceTitle(serviceType);
  const icon = getServiceIcon(serviceType);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.placeholder}>
          {icon}
          <h3>{title}</h3>
          <p>Функционал Сервиса для "{title}" будет доступен позже</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceView;