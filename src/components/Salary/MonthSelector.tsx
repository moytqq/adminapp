'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { salaryApi, MonthOption } from '@/services/salaryApi';
import styles from './MonthSelector.module.scss';
import { Calendar, ChevronDown, Loader } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMonths();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMonths = async () => {
    setLoading(true);
    try {
      const data = await salaryApi.getMonths();
      setMonths(data);

      if (data.length > 0 && !selectedMonth) {
        onMonthChange(data[0].month);
      }
    } catch (error) {
      console.error('Error loading months:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayMonth = (month: string) => {
    const date = new Date(month);
    return format(date, 'LLLL yyyy', { locale: ru });
  };

  return (
    <div className={styles.monthSelector} ref={dropdownRef}>
      <button className={styles.selectorButton} onClick={() => setIsOpen(!isOpen)} disabled={loading}>
        <Calendar size={16} />
        {loading ? (
          <span>Загрузка...</span>
        ) : (
          <>
            <span>{formatDisplayMonth(selectedMonth)}</span>
            <ChevronDown size={16} className={isOpen ? styles.rotated : ''} />
          </>
        )}
      </button>

      {isOpen && !loading && (
        <div className={styles.dropdown}>
          {months.length === 0 ? (
            <div className={styles.emptyState}>Нет данных</div>
          ) : (
            months.map((month) => (
              <button
                key={month.id}
                className={`${styles.monthOption} ${month.month === selectedMonth ? styles.selected : ''}`}
                onClick={() => {
                  onMonthChange(month.month);
                  setIsOpen(false);
                }}
              >
                {formatDisplayMonth(month.month)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MonthSelector;