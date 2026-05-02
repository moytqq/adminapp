'use client';

import React from 'react';
import styles from './RemainderFormSelector.module.scss';
import { ClipboardList } from 'lucide-react';

export interface RemainderForm {
  id: number;
  name: string;
  address: number;
}

interface RemainderFormSelectorProps {
  forms: RemainderForm[];
  onSelectForm: (form: RemainderForm) => void;
  loading?: boolean;
}

const RemainderFormSelector: React.FC<RemainderFormSelectorProps> = ({ forms, onSelectForm, loading }) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка форм...</p>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className={styles.empty}>
        <ClipboardList size={48} />
        <p>Нет доступных форм</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Выберите магазин</h1>
        <p>Выберите магазин для заполнения остатков</p>
      </div>
      <div className={styles.grid}>
        {forms.map(form => (
          <button
            key={form.id}
            className={styles.card}
            onClick={() => onSelectForm(form)}
          >
            <div className={styles.iconWrapper}>
              <ClipboardList size={32} />
            </div>
            <h3 className={styles.title}>{form.name}</h3>
            <div className={styles.arrow}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RemainderFormSelector;