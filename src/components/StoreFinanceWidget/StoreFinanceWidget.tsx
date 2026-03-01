'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi, MonthReport } from '@/services/reportsApi';
import FinanceChart from './FinanceChart';
import styles from './StoreFinanceWidget.module.scss';
import { X, ChevronDown, Filter, Calendar, ArrowLeft } from 'lucide-react';

interface StoreFinanceWidgetProps {
  hid: string;
  storeName?: string;
  onClose: () => void;
  isMobile?: boolean | null;
}

type PeriodType = 'all' | 'year' | 'half-year' | 'quarter' | 'custom';

interface ChartVisibility {
  checks: boolean;
  average: boolean;
  total: boolean;
}

const PERIODS = [
  { value: 'all', label: 'За все время' },
  { value: 'year', label: 'Последний год' },
  { value: 'half-year', label: 'Последние 6 месяцев' },
  { value: 'quarter', label: 'Последние 3 месяца' },
];

const StoreFinanceWidget: React.FC<StoreFinanceWidgetProps> = ({
                                                                 hid,
                                                                 storeName,
                                                                 onClose,
                                                                 isMobile = false,
                                                               }) => {
  const [data, setData] = useState<MonthReport[]>([]);
  const [filteredData, setFilteredData] = useState<MonthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('year');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [visibility, setVisibility] = useState<ChartVisibility>({
    checks: true,
    average: true,
    total: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.getMonths(hid);
      setData(result);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data.length) {
      setFilteredData([]);
      return;
    }

    const sorted = [...data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const now = new Date();
    let cutoffDate: Date | null = null;

    switch (selectedPeriod) {
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'half-year':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case 'quarter':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        cutoffDate = null;
    }

    if (cutoffDate) {
      const filtered = sorted.filter(item => new Date(item.date) >= cutoffDate!);
      setFilteredData(filtered.length ? filtered : sorted);
    } else {
      setFilteredData(sorted);
    }
  }, [data, selectedPeriod]);

  const toggleVisibility = (key: keyof ChartVisibility) => {
    setVisibility(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className={`${styles.widget} ${isMobile ? styles.isMobile : ''}`}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            <ArrowLeft size={18} />
          </button>
          <h3>Финансовая аналитика</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.widget} ${isMobile ? styles.isMobile : ''}`}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>
            <ArrowLeft size={18} />
          </button>
          <h3>Финансовая аналитика</h3>
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadData}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.widget} ${isMobile ? styles.isMobile : ''}`}>
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerTitle}>
          <h3>Финансовая аналитика</h3>
          {storeName && <span className={styles.storeName}>{storeName}</span>}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.periodSelector}>
          <Calendar size={16} className={styles.periodIcon} />
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownButton}
              onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
            >
              <span>{PERIODS.find(p => p.value === selectedPeriod)?.label}</span>
              <ChevronDown size={16} className={isPeriodMenuOpen ? styles.rotated : ''} />
            </button>
            {isPeriodMenuOpen && (
              <div className={styles.dropdownMenu}>
                {PERIODS.map(period => (
                  <button
                    key={period.value}
                    className={`${styles.dropdownItem} ${selectedPeriod === period.value ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedPeriod(period.value as PeriodType);
                      setIsPeriodMenuOpen(false);
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.visibilityControls}>
          <span className={styles.visibilityLabel}>
            <Filter size={14} />
            Показать:
          </span>
          <div className={styles.checkboxes}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={visibility.checks}
                onChange={() => toggleVisibility('checks')}
              />
              <span className={styles.checkboxLabel} style={{ color: '#2196f3' }}>
                Кол-во чеков
              </span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={visibility.average}
                onChange={() => toggleVisibility('average')}
              />
              <span className={styles.checkboxLabel} style={{ color: '#ff9800' }}>
                Средний чек
              </span>
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={visibility.total}
                onChange={() => toggleVisibility('total')}
              />
              <span className={styles.checkboxLabel} style={{ color: '#4caf50' }}>
                Общая выручка
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.charts}>
        {filteredData.length === 0 ? (
          <div className={styles.noData}>
            <p>Нет данных за выбранный период</p>
          </div>
        ) : (
          <>
            <FinanceChart
              data={filteredData}
              dataKey="c"
              title="Количество чеков"
              color="#2196f3"
              unit="шт"
              formatValue={formatNumber}
              isVisible={visibility.checks}
            />
            <FinanceChart
              data={filteredData}
              dataKey="t"
              title="Средний чек"
              color="#ff9800"
              unit="₽"
              formatValue={formatCurrency}
              isVisible={visibility.average}
            />
            <FinanceChart
              data={filteredData}
              dataKey="s"
              title="Общая выручка"
              color="#4caf50"
              unit="₽"
              formatValue={formatCurrency}
              isVisible={visibility.total}
            />
          </>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.statsSummary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Всего месяцев:</span>
            <span className={styles.summaryValue}>{filteredData.length}</span>
          </div>
          {filteredData.length > 0 && (
            <>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Общая выручка:</span>
                <span className={styles.summaryValue}>
                  {formatCurrency(filteredData.reduce((sum, item) => sum + item.s, 0))}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Всего чеков:</span>
                <span className={styles.summaryValue}>
                  {formatNumber(filteredData.reduce((sum, item) => sum + item.c, 0))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreFinanceWidget;