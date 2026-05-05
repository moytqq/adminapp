'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { serviceApi, ServiceType } from '@/services/serviceApi';
import styles from './ServiceTypeSelector.module.scss';
import { Loader, History, Wrench } from 'lucide-react';

interface ServiceTypeSelectorProps {
  onSelectType: (type: ServiceType) => void;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ onSelectType }) => {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { flags } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await serviceApi.getTypes();
      setTypes(data);
    } catch (err) {
      console.error('Error loading service types:', err);
      setError('Ошибка при загрузке типов услуг');
    } finally {
      setLoading(false);
    }
  };

  const getColorForType = (type: string): string => {
    const colors: Record<string, string> = {
      base_type: '#2196f3',
    };
    return colors[type] || '#9c27b0';
  };

  const getBgColorForType = (type: string): string => {
    const bgColors: Record<string, string> = {
      base_type: '#e3f2fd',
    };
    return bgColors[type] || '#f3e5f5';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={48} className={styles.spinner} />
        <p>Загрузка типов услуг...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadTypes}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Сервис</h1>
        <p>Выберите тип услуги</p>
      </div>
      <div className={styles.grid}>
        {types.map(type => (
          <button
            key={type.id}
            className={styles.card}
            onClick={() => onSelectType(type)}
            style={{ backgroundColor: getBgColorForType(type.type) }}
          >
            <div className={styles.iconWrapper} style={{ color: getColorForType(type.type) }}>
              <div className={styles.defaultIcon} />
              <Wrench size={32} />
            </div>
            <h3 className={styles.title}>{type.name}</h3>
            <p className={styles.description}>{type.type}</p>
            <div className={styles.arrow}>→</div>
          </button>
        ))}

        <button
          className={styles.card}
          onClick={() => onSelectType({ id: -1, type: 'history', name: 'История заявок' } as ServiceType)}
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

export default ServiceTypeSelector;