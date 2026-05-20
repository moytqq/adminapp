'use client';

import React from 'react';
import AutoOrdersTableView from './AutoOrdersTableView';
import ItemsMatrix from './ItemsMatrix/ItemsMatrix';
import SupplierSettingsComponent from './SupplierSettings/SupplierSettings';
import { ArrowLeft } from 'lucide-react';
import styles from './AutoOrdersView.module.scss';

interface AutoOrdersViewProps {
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
  return titles[type] || 'Автозаказы';
};

const AutoOrdersView: React.FC<AutoOrdersViewProps> = ({ autoOrderType, onBack }) => {
  if (autoOrderType === 'workInProgress') {
    return <AutoOrdersTableView autoOrderType={autoOrderType} onBack={onBack} />;
  }

  if (autoOrderType === 'itemsMatrix') {
    return <ItemsMatrix onBack={onBack} />;
  }

  if (autoOrderType === 'suppliers') {
    return <SupplierSettingsComponent onBack={onBack} />;
  }

  return (
    <div className={styles.placeholderContainer}>
      <button className="typeSelectorBackButtonGray" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Назад</span>
      </button>
      <div>
        <div className={styles.placeholder}>
          <h3>{getAutoOrderTitle(autoOrderType)}</h3>
          <p>Функционал для этого типа автозаказов будет доступен позже</p>
        </div>
      </div>
    </div>
  );
};

export default AutoOrdersView;
