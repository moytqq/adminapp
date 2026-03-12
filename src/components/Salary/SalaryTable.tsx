// components/Salary/SalaryTable.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { salaryApi, SalaryListItem } from '@/services/salaryApi';
import styles from './SalaryTable.module.scss';
import { ArrowRight, Loader } from 'lucide-react';

interface SalaryTableProps {
  month: string;
  onSelectPerson: (id: number, name: string) => void;
  selectedPersonId?: number;
}

const SalaryTable: React.FC<SalaryTableProps> = ({
                                                   month,
                                                   onSelectPerson,
                                                   selectedPersonId
                                                 }) => {
  const [data, setData] = useState<SalaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'summary' | 'addition'>('summary');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await salaryApi.getList(month);
      setData(list);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'summary' | 'addition') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? a.person.name.localeCompare(b.person.name)
        : b.person.name.localeCompare(a.person.name);
    }

    const aValue = sortBy === 'summary' ? a.summary : a.addition;
    const bValue = sortBy === 'summary' ? b.summary : b.addition;

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={40} className={styles.spinner} />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadData}>Повторить</button>
      </div>
    );
  }

  return (
    <div className={styles.salaryTable}>
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div
            className={`${styles.headerCell} ${styles.sortable} ${sortBy === 'name' ? styles.active : ''}`}
            onClick={() => handleSort('name')}
          >
            Сотрудник
            {sortBy === 'name' && (
              <span className={styles.sortIcon}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable} ${sortBy === 'summary' ? styles.active : ''}`}
            onClick={() => handleSort('summary')}
          >
            Баллы
            {sortBy === 'summary' && (
              <span className={styles.sortIcon}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable} ${sortBy === 'addition' ? styles.active : ''}`}
            onClick={() => handleSort('addition')}
          >
            Доп. выплаты
            {sortBy === 'addition' && (
              <span className={styles.sortIcon}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className={styles.headerCell}></div>
        </div>

        <div className={styles.tableBody}>
          {sortedData.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нет данных за выбранный месяц</p>
            </div>
          ) : (
            sortedData.map((item) => (
              <div
                key={item.person.id}
                className={`${styles.tableRow} ${selectedPersonId === item.person.id ? styles.selected : ''}`}
                onClick={() => onSelectPerson(item.person.id, item.person.name)}
              >
                <div className={styles.cell}>
                  <div className={styles.personInfo}>
                    <div className={styles.avatar} />
                    <span className={styles.personName}>{item.person.name}</span>
                  </div>
                </div>
                <div className={styles.cell}>
                  <span className={styles.summary}>{formatNumber(item.summary)}</span>
                </div>
                <div className={styles.cell}>
                  <span className={styles.addition}>
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      minimumFractionDigits: 2,
                    }).format(item.addition)}
                  </span>
                </div>
                <div className={styles.cell}>
                  <button className={styles.detailsButton}>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryTable;