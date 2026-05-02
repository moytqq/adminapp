// components/AutoOrders/AutoOrdersView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ItemSelector, { SelectorItem } from './ItemSelector';
import AutoOrdersTableView from './AutoOrdersTableView';
import RemaindersView from './RemaindersView';
import { remaindersApi, RemainderForm } from '@/services/remaindersApi';
import { Package } from 'lucide-react';
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
    remainders: 'Остатки',
  };
  return titles[type] || 'Автозаказы';
};

const AutoOrdersView: React.FC<AutoOrdersViewProps> = ({ autoOrderType, onBack }) => {
  const [forms, setForms] = useState<RemainderForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<RemainderForm | null>(null);
  const [loadingForms, setLoadingForms] = useState(false);

  useEffect(() => {
    if (autoOrderType === 'remainders') {
      loadForms();
    }
  }, [autoOrderType]);

  const loadForms = async () => {
    setLoadingForms(true);
    try {
      const data = await remaindersApi.getFormsList();
      setForms(data);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  // Для остатков: выбор магазина
  if (autoOrderType === 'remainders') {
    if (!selectedForm) {
      const items: SelectorItem[] = forms.map(form => ({
        id: form.id,
        name: form.name.replace(/^[^ ]* /, ''),
        //description: `Адрес: ${form.address}`,
        icon: <Package size={28} />,
      }));

      return (
        <ItemSelector
          title="Остатки"
          subtitle="Выберите магазин для заполнения остатков"
          items={items}
          onSelect={(item) => {
            const form = forms.find(f => f.id === Number(item.id));
            if (form) setSelectedForm(form);
          }}
          loading={loadingForms}
          onBack={onBack}
          showBackButton={true}
        />
      );
    }

    return <RemaindersView form={selectedForm} onBack={() => setSelectedForm(null)} />;
  }

  // Для товарной матрицы
  if (autoOrderType === 'itemsMatrix') {
    return <AutoOrdersTableView autoOrderType={autoOrderType} onBack={onBack} />;
  }

  // Для остальных типов: заглушка
  return (
    <div className={styles.placeholderContainer}>
      <div className={styles.placeholder}>
        <h3>{getAutoOrderTitle(autoOrderType)}</h3>
        <p>Функционал для этого типа автозаказов будет доступен позже</p>
      </div>
    </div>
  );
};

export default AutoOrdersView;