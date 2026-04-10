import React from 'react';
import styles from './AutoOrderView.module.scss';
import {
  Calendar,
  CalendarClock,
  Table, ShoppingCart, CalendarSync, CalendarCheck2,
} from 'lucide-react';

interface AutoOrderViewProps {
  autoOrderType: string;
  onBack?: () => void;
}

const getAutoOrderTitle = (type: string): string => {
  const titles: Record<string, string> = {
    itemsMatrix: 'Товарная матрица',
    nonProfitablePurchases: 'Некоммерческие закупки',
    workInProgress: 'В работе',
    completed: 'Выполнены',
    urgentOrder: 'Срочный заказ',
  };
  return titles[type] || 'Планировщик';
};

const getAutoOrderIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    itemsMatrix: <Table size={48} />,
    nonProfitablePurchases: <ShoppingCart size={48} />,
    workInProgress: <CalendarSync size={48} />,
    completed: <CalendarCheck2 size={48} />,
    urgentOrder: <CalendarClock size={48} />,
  };
  return icons[type] || <Calendar size={48} />;
};

const AutoOrderView: React.FC<AutoOrderViewProps> = ({ autoOrderType, onBack }) => {
  const title = getAutoOrderTitle(autoOrderType);
  const icon = getAutoOrderIcon(autoOrderType);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.placeholder}>
          {icon}
          <h3>{title}</h3>
          <p>Функционал Автозаказов для "{title}" будет доступен позже</p>
        </div>
      </div>
    </div>
  );
};

export default AutoOrderView;