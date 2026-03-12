'use client';

import React, { useState, useEffect } from 'react';
import { salaryApi, SalaryDetails } from '@/services/salaryApi';
import styles from './SalaryDetailsTable.module.scss';
import {
  Store,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle
} from 'lucide-react';

interface SalaryDetailsTableProps {
  month: string;
  personId: number;
  personName: string;
  onBack: () => void;
}

const SalaryDetailsTable: React.FC<SalaryDetailsTableProps> = ({
                                                                 month,
                                                                 personId,
                                                                 personName,
                                                                 onBack,
                                                               }) => {
  const [data, setData] = useState<SalaryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetails();
  }, [month, personId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const details = await salaryApi.getDetails(month, personId);
      setData(details);
    } catch (err) {
      setError('Ошибка загрузки детальной информации');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return styles.positive;
    if (growth < 0) return styles.negative;
    return '';
  };

  const getAttendanceIcon = (value: number) => {
    switch(value) {
      case 1:
        return <CheckCircle size={16} className={styles.checkIcon} />;
      case 0:
        return <XCircle size={16} className={styles.xIcon} />;
      default:
        return <MinusCircle size={16} className={styles.minusIcon} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={40} className={styles.spinner} />
        <p>Загрузка детальной информации...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.error}>
        <p>{error || 'Ошибка загрузки данных'}</p>
        <button onClick={loadDetails}>Повторить</button>
      </div>
    );
  }

  const combinedData = data.details.growth.map(growthItem => {
    const attendanceItem = data.details.attendance.find(a => a.item.id === growthItem.item.id);
    return {
      ...growthItem,
      attendance: attendanceItem?.attendance || []
    };
  });

  return (
    <div className={styles.detailsTable}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.personInfo}>
          <h3>{personName}</h3>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Баллы:</span>
            <span className={styles.summaryValue}>{data.summary.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Магазин</div>
          <div className={styles.headerCell}>Пред. месяц</div>
          <div className={styles.headerCell}>Тек. месяц</div>
          <div className={styles.headerCell}>Изменение</div>
          <div className={styles.headerCell}>Посещаемость</div>
        </div>

        <div className={styles.tableBody}>
          {combinedData.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Нет данных по магазинам</p>
            </div>
          ) : (
            combinedData.map((item) => (
              <div key={item.item.id} className={styles.tableRow}>
                <div className={styles.cell}>
                  <div className={styles.storeInfo}>
                    <span>{item.item.name}</span>
                  </div>
                </div>
                <div className={styles.cell}>
                  {formatCurrency(item.previous_value)}
                </div>
                <div className={styles.cell}>
                  {formatCurrency(item.current_value)}
                </div>
                <div className={styles.cell}>
                  <span className={`${styles.growth} ${getGrowthColor(item.growth)}`}>
                    {item.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatPercent(item.growth)}
                  </span>
                </div>
                <div className={styles.cell}>
                  <div className={styles.attendance}>
                    <div className={styles.attendanceIcons}>
                      {item.attendance.length > 0 ? (
                        item.attendance.map((value, idx) => (
                          <span key={idx} className={styles.attendanceIcon}>
                            {getAttendanceIcon(value)}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noAttendance}>—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryDetailsTable;