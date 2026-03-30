'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi, ProductSale } from '@/services/reportsApi';
import { exportService } from '@/services/exportService';
import styles from './ReportsView.module.scss';
import { Loader, Download, FileSpreadsheet } from 'lucide-react';

const ADDRESSES = [
  { value: 'Бугры', label: 'Бугры' },
  { value: 'Сведлово', label: 'Сведлово' },
  { value: 'Ропша', label: 'Ропша' },
  { value: 'Мурино', label: 'Мурино' },
  { value: 'Ветеранов', label: 'Ветеранов' },
  { value: 'Тихорецкий', label: 'Тихорецкий' },
  { value: 'Ленсовета', label: 'Ленсовета' },
  { value: 'Абрамова', label: 'Абрамова' },
  { value: 'Гагарина', label: 'Гагарина' },
  { value: 'Горелово', label: 'Горелово' },
];

interface ProductRow {
  productName: string;
  months: Record<string, { count: number; sum: number }>;
  totalCount: number;
  totalSum: number;
}

const ReportsView: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<string>('Сведлово');
  const [data, setData] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedAddress]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.getProductSales(selectedAddress);
      setData(result);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
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
      selectedAddress,
      months,
      productRows,
      monthlyTotals,
      grandTotal
    );
  };

  const handleExportCSV = () => {
    if (productRows.length === 0) return;

    const headers = ['Товар', ...months.map(m => `${m.fullLabel} (кол-во)`), ...months.map(m => `${m.fullLabel} (сумма)`), 'Итого кол-во', 'Итого сумма'];

    const rows = productRows.map(product => {
      const monthCounts = months.map(m => product.months[m.key]?.count || 0);
      const monthSums = months.map(m => product.months[m.key]?.sum || 0);
      return [product.productName, ...monthCounts, ...monthSums, product.totalCount, product.totalSum];
    });

    const totalRow = [
      'ИТОГО',
      ...months.map(m => monthlyTotals[m.key]?.count || 0),
      ...months.map(m => monthlyTotals[m.key]?.sum || 0),
      grandTotal.count,
      grandTotal.sum,
    ];

    rows.push(totalRow);

    exportService.exportToCSV({
      sheetName: `Отчет_${selectedAddress}`,
      headers,
      rows,
    }, `Отчет_по_продажам_${selectedAddress}_${new Date().toLocaleDateString('ru-RU')}`);
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

  return (
    <div className={styles.reportsView}>
      <div className={styles.subHeader}>
        <h3>Отчеты по продажам напитков</h3>
        <div className={styles.controls}>
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
          <div className={styles.exportButtons}>
            <button
              className={styles.exportExcelButton}
              onClick={handleExportExcel}
              disabled={productRows.length === 0}
              title="Экспорт в Excel"
            >
              <Download size={18} />
              <span>Excel</span>
            </button>
            {/*<button
              className={styles.exportButton}
              onClick={handleExportCSV}
              disabled={productRows.length === 0}
              title="Экспорт в CSV"
            >
              <FileSpreadSheet size={18} />
              <span>CSV</span>
            </button>*/}
          </div>
        </div>
      </div>

      {productRows.length === 0 ? (
        <div className={styles.noData}>
          <p>Нет данных для отображения</p>
        </div>
      ) : (
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
                      {formatNumber(product.months[month.key]?.count || 0)} шт.
                    </td>
                    <td className={styles.sumCell}>
                      {formatCurrency(product.months[month.key]?.sum || 0)}
                    </td>
                  </React.Fragment>
                ))}
                <td className={styles.totalCountCell}>
                  {formatNumber(product.totalCount)} шт.
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
                    {formatNumber(monthlyTotals[month.key]?.count || 0)} шт.
                  </td>
                  <td className={styles.sumCell}>
                    {formatCurrency(monthlyTotals[month.key]?.sum || 0)}
                  </td>
                </React.Fragment>
              ))}
              <td className={styles.totalCountCell}>
                {formatNumber(grandTotal.count)} шт.
              </td>
              <td className={styles.totalSumCell}>
                {formatCurrency(grandTotal.sum)}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportsView;