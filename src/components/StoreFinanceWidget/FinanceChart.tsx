
'use client';

import React, { useMemo } from 'react';
import { MonthReport } from '@/services/reportsApi';
import styles from './FinanceChart.module.scss';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FinanceChartProps {
  data: MonthReport[];
  dataKey: 'c' | 't' | 's';
  title: string;
  color: string;
  unit: string;
  formatValue?: (value: number) => string;
  isVisible: boolean;
}


const FinanceChart: React.FC<FinanceChartProps> = ({
                                                     data,
                                                     dataKey,
                                                     title,
                                                     color,
                                                     unit,
                                                     formatValue,
                                                     isVisible,
                                                   }) => {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const sorted = [...data].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const maxValue = Math.max(...sorted.map(item => item[dataKey]));

    return sorted.map(item => ({
      date: new Date(item.date),
      value: item[dataKey],
      percentage: (item[dataKey] / maxValue) * 100,
      formattedDate: new Date(item.date).toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      }),
    }));
  }, [data, dataKey]);

  const getChange = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;

    return {
      value: change,
      isPositive: change >= 0,
    };
  }, [chartData]);

  const defaultFormat = (value: number) => {
    if (dataKey === 's') {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (dataKey === 't') {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString('ru-RU');
  };

  if (!isVisible) return null;

  return (
    <div className={styles.chart}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <span className={styles.colorDot} style={{ backgroundColor: color }} />
          <h4>{title}</h4>
        </div>
        {getChange && (
          <div className={`${styles.change} ${getChange.isPositive ? styles.positive : styles.negative}`}>
            {getChange.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{getChange.value.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className={styles.chartContent}>
        <div className={styles.barsContainer}>
          {chartData.map((item, index) => (
            <div key={index} className={styles.barWrapper}>
              <div className={styles.barTooltip}>
                <div className={styles.tooltipValue}>
                  {formatValue ? formatValue(item.value) : defaultFormat(item.value)}
                </div>
                <div className={styles.tooltipDate}>{item.formattedDate}</div>
              </div>
              <div
                className={styles.bar}
                style={{
                  height: `${item.percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          ))}
        </div>

        <div className={styles.axisLabels}>
          {chartData.map((item, index) => (
            <div key={index} className={styles.axisLabel}>
              {item.formattedDate.split('')[0].toUpperCase()}
            </div>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Среднее:</span>
            <span className={styles.statValue}>
              {formatValue
                ? formatValue(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)
                : defaultFormat(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)
              }
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Максимум:</span>
            <span className={styles.statValue}>
              {formatValue
                ? formatValue(Math.max(...chartData.map(item => item.value)))
                : defaultFormat(Math.max(...chartData.map(item => item.value)))
              }
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Минимум:</span>
            <span className={styles.statValue}>
              {formatValue
                ? formatValue(Math.min(...chartData.map(item => item.value)))
                : defaultFormat(Math.min(...chartData.map(item => item.value)))
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceChart;