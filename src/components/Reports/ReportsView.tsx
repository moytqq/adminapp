'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi, ProductSale } from '@/services/reportsApi';
import { exportService } from '@/services/exportService';
import styles from './ReportsView.module.scss';
import { Loader, Download, FileSpreadsheet, ZoomIn, ZoomOut, Maximize2, Minimize2, X } from 'lucide-react';

interface ReportsViewProps {
  reportType: string;
}

const ADDRESSES = [
  { value: 'Бугры', label: 'Бугры' },
  { value: 'Сведлово', label: 'Сведлово' },
  { value: 'Ропша', label: 'Ропша' },
  { value: 'Мурино', label: 'Мурино' },
  { value: 'Ветеранов', label: 'Ветеранов' },
  { value: 'Тихорецкий', label: 'Тихорецкий' },
  { value: 'Абрамова', label: 'Абрамова' },
  { value: 'Гагарина', label: 'Гагарина' },
];

interface ProductRow {
  productName: string;
  months: Record<string, { count: number; sum: number }>;
  totalCount: number;
  totalSum: number;
}

const ReportsView: React.FC<ReportsViewProps> = ({ reportType }) => {
  const [selectedAddress, setSelectedAddress] = useState<string>('Сведлово');
  const [data, setData] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--reports-table-font-size', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 18));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    loadData();
  }, [selectedAddress, reportType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let result: ProductSale[];
      switch (reportType) {
        case 'drinks':
        default:
          result = await reportsApi.getProductSales(selectedAddress);
          break;
      }
      setData(result);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getExportName = () => {
    switch (reportType) {
      case 'drinks':
        return 'напитков';
      default:
        return 'отчет';
    }
  };

  const months = useMemo(() => {
    const monthSet = new Set<string>();
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthSet.add(monthKey);
    });

    return Array.from(monthSet)
      .sort()
      .map(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          key: monthKey,
          label: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
          fullLabel: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
          year: parseInt(year),
          monthNumber: parseInt(monthNum),
        };
      });
  }, [data]);

  const productRows = useMemo(() => {
    const productsMap = new Map<string, ProductRow>();

    data.forEach(item => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!productsMap.has(item.name)) {
        productsMap.set(item.name, {
          productName: item.name,
          months: {},
          totalCount: 0,
          totalSum: 0,
        });
      }

      const product = productsMap.get(item.name)!;

      if (!product.months[monthKey]) {
        product.months[monthKey] = { count: 0, sum: 0 };
      }

      product.months[monthKey].count += item.count;
      product.months[monthKey].sum += item.sum;
      product.totalCount += item.count;
      product.totalSum += item.sum;
    });

    return Array.from(productsMap.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
  }, [data]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<string, { count: number; sum: number }> = {};

    months.forEach(month => {
      totals[month.key] = { count: 0, sum: 0 };
    });

    productRows.forEach(product => {
      Object.entries(product.months).forEach(([monthKey, values]) => {
        if (totals[monthKey]) {
          totals[monthKey].count += values.count;
          totals[monthKey].sum += values.sum;
        }
      });
    });

    return totals;
  }, [productRows, months]);

  const grandTotal = useMemo(() => {
    let totalCount = 0;
    let totalSum = 0;
    productRows.forEach(product => {
      totalCount += product.totalCount;
      totalSum += product.totalSum;
    });
    return { count: totalCount, sum: totalSum };
  }, [productRows]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU');
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleExportExcel = () => {
    if (productRows.length === 0) return;

    exportService.exportSalesReport(
      `${selectedAddress}_${getExportName()}`,
      months,
      productRows,
      monthlyTotals,
      grandTotal
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={48} className={styles.spinner} />
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

  const tableContent = (
    <div className={styles.tableContainer}>
      <table className={styles.reportTable}>
        <thead>
        <tr>
          <th className={styles.productColumn}>Товар</th>
          {months.map(month => (
            <th key={`${month.key}-count`} colSpan={2} className={styles.monthHeader}>
              {month.label}
            </th>
          ))}
          <th colSpan={2} className={styles.totalHeader}>Итого</th>
        </tr>
        <tr>
          <th className={styles.productColumn}></th>
          {months.map(month => (
            <React.Fragment key={month.key}>
              <th className={styles.countHeader}>Кол-во</th>
              <th className={styles.sumHeader}>Сумма</th>
            </React.Fragment>
          ))}
          <th className={styles.totalCountHeader}>Кол-во</th>
          <th className={styles.totalSumHeader}>Сумма</th>
        </tr>
        </thead>
        <tbody>
        {productRows.map(product => (
          <tr key={product.productName}>
            <td className={styles.productCell}>{product.productName}</td>
            {months.map(month => (
              <React.Fragment key={month.key}>
                <td className={styles.countCell}>
                  {formatNumber(product.months[month.key]?.count || 0)}
                </td>
                <td className={styles.sumCell}>
                  {formatCurrency(product.months[month.key]?.sum || 0)}
                </td>
              </React.Fragment>
            ))}
            <td className={styles.totalCountCell}>
              {formatNumber(product.totalCount)}
            </td>
            <td className={styles.totalSumCell}>
              {formatCurrency(product.totalSum)}
            </td>
          </tr>
        ))}
        <tr className={styles.totalRow}>
          <td className={styles.productCell}>ИТОГО</td>
          {months.map(month => (
            <React.Fragment key={month.key}>
              <td className={styles.countCell}>
                {formatNumber(monthlyTotals[month.key]?.count || 0)}
              </td>
              <td className={styles.sumCell}>
                {formatCurrency(monthlyTotals[month.key]?.sum || 0)}
              </td>
            </React.Fragment>
          ))}
          <td className={styles.totalCountCell}>
            {formatNumber(grandTotal.count)}
          </td>
          <td className={styles.totalSumCell}>
            {formatCurrency(grandTotal.sum)}
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  );

  // Полноэкранный режим
  if (isFullscreen && isMobile) {
    return (
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenHeader}>
          <div className={styles.fullscreenTitle}>
            <span>Таблица продаж</span>
            <span className={styles.fullscreenAddress}>{selectedAddress}</span>
          </div>
          <div className={styles.fullscreenControls}>
            <div className={styles.fontSizeControls}>
              <button
                className={styles.fontSizeButton}
                onClick={decreaseFontSize}
                disabled={fontSize <= 10}
                title="Уменьшить шрифт"
              >
                <ZoomOut size={18} />
              </button>
              <span className={styles.fontSizeValue}>{fontSize}px</span>
              <button
                className={styles.fontSizeButton}
                onClick={increaseFontSize}
                disabled={fontSize >= 18}
                title="Увеличить шрифт"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button
              className={styles.fullscreenCloseButton}
              onClick={toggleFullscreen}
              title="Закрыть полноэкранный режим"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
        <div className={styles.fullscreenContent}>
          {tableContent}
        </div>
      </div>
    );
  }

  // Обычный режим
  return (
    <div className={styles.reportsView}>
      <div className={styles.controls}>
        <div className={styles.leftControls}>
          <select
            className={styles.addressSelect}
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
          >
            {ADDRESSES.map(addr => (
              <option key={addr.value} value={addr.value}>
                {addr.label}
              </option>
            ))}
          </select>
          <div className={styles.fontSizeControls}>
            <button
              className={styles.fontSizeButton}
              onClick={decreaseFontSize}
              disabled={fontSize <= 10}
              title="Уменьшить шрифт"
            >
              <ZoomOut size={18} />
            </button>
            <span className={styles.fontSizeValue}>{fontSize}px</span>
            <button
              className={styles.fontSizeButton}
              onClick={increaseFontSize}
              disabled={fontSize >= 24}
              title="Увеличить шрифт"
            >
              <ZoomIn size={18} />
            </button>
          </div>
          {isMobile && (
            <button
              className={styles.fullscreenButton}
              onClick={toggleFullscreen}
              title="Полноэкранный режим"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>
        <div className={styles.exportButtons}>
          <button
            className={styles.exportExcelButton}
            onClick={handleExportExcel}
            disabled={productRows.length === 0}
            title="Экспорт в Excel"
          >
            <FileSpreadsheet size={18} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {productRows.length === 0 ? (
        <div className={styles.noData}>
          <p>Нет данных для отображения</p>
        </div>
      ) : (
        tableContent
      )}
    </div>
  );
};

export default ReportsView;