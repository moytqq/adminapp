'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { reportsApi, ProductSale } from '@/services/reportsApi';
import { exportExcelService } from '@/services/exportExcelService';
import styles from './ReportsView.module.scss';
import {
  Loader,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft, ChartLine, Table, ArrowRight, ArrowDown,
} from 'lucide-react';
import DynamicCharts from './DynamicCharts';
import { chartExportService } from '@/services/chartExportService';
import { pdfExportDessertsService } from '@/services/pdfExportDessertsService';
import { pdfExportUniversalService } from '@/services/pdfExportUniversalService';

interface ReportsViewProps {
  reportType: string;
  onBack?: () => void;
}

const ADDRESSES = [
  { value: 'Абрамова', label: 'Абрамова' },
  { value: 'Бугры', label: 'Бугры' },
  { value: 'Ветеранов', label: 'Ветеранов' },
  { value: 'Гагарина', label: 'Гагарина' },
  { value: 'Ленсовета', label: 'Ленсовета' },
  { value: 'Мурино', label: 'Мурино' },
  { value: 'Ропша', label: 'Ропша' },
  { value: 'Свердлово', label: 'Свердлово' },
  { value: 'Тихорецкий', label: 'Тихорецкий' },
];

interface MonthData {
  key: string;
  label: string;
  fullLabel: string;
  year: number;
  monthNumber: number;
}

interface ProductRow {
  productName: string;
  months: Record<string, { count: number; sum: number }>;
  totalCount: number;
  totalSum: number;
}

interface MonthlyTotal {
  count: number;
  sum: number;
}

const ReportsView: React.FC<ReportsViewProps> = ({ reportType, onBack }) => {
  const [selectedAddress, setSelectedAddress] = useState<string>('Бугры');
  const [data, setData] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [exportingChartsPdf, setExportingChartsPdf] = useState(false);
  const [pdfQuality, setPdfQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [chartQuality, setChartQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [chartFormat, setChartFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [showAdditionalAssortment, setShowAdditionalAssortment] = useState(false);

  const [fullscreenTable, setFullscreenTable] = useState<string | null>(null);
  const [fullscreenFontSize, setFullscreenFontSize] = useState<number>(14);
  const tableRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    if (fullscreenTable) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenTable]);

  const increaseFontSize = () => {
    if (fullscreenTable) {
      setFullscreenFontSize(prev => Math.min(prev + 2, 18));
    } else {
      setFontSize(prev => Math.min(prev + 2, 18));
    }
  };

  const decreaseFontSize = () => {
    if (fullscreenTable) {
      setFullscreenFontSize(prev => Math.max(prev - 2, 8));
    } else {
      setFontSize(prev => Math.max(prev - 2, 8));
    }
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
          result = await reportsApi.getDrinksSales(selectedAddress);
          break;
        case 'desserts':
          result = await reportsApi.getDessertsSales(selectedAddress);
          break;
        case 'bread':
          result = await reportsApi.getBreadSales(selectedAddress);
          break;
        case 'salads':
          result = await reportsApi.getSaladsSales(selectedAddress);
          break;
        case 'soups':
          result = await reportsApi.getSoupsSales(selectedAddress);
          break;
        case 'hot':
          result = await reportsApi.getHotSales(selectedAddress);
          break;
        default:
          result = [];
      }
      setData(result);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'drinks':
        return 'Напитки';
      case 'desserts':
        return 'Десерты';
      case 'bread':
        return 'Хлеб-Выпечка';
      case 'salads':
        return 'Салаты';
      case 'soups':
        return 'Супы';
      case 'hot':
        return 'Горячее';
      default:
        return 'Отчет';
    }
  };

  const getExportName = () => {
    switch (reportType) {
      case 'drinks':
        return 'напитков';
      case 'desserts':
        return 'десертов';
      case 'bread':
        return 'хлеб_выпечка';
      case 'salads':
        return 'салатов';
      case 'soups':
        return 'супов';
      case 'hot':
        return 'горячее';
      default:
        return 'отчет';
    }
  };

  const months: MonthData[] = useMemo(() => {
    const monthSet = new Set<string>();
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthSet.add(monthKey);
    });

    return Array.from(monthSet)
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      })
      .map(monthKey => {
        const [year, monthNum] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return {
          key: monthKey,
          label: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }).replace(' г.', ''),
          fullLabel: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', ''),
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
      a.productName.localeCompare(b.productName),
    );
  }, [data]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<string, MonthlyTotal> = {};

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

  const formatPercent = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangePercent = (current: number, previous: number): number | null => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const handleExportExcel = () => {
    if (productRows.length === 0) return;

    exportExcelService.exportSalesReport(
      `${selectedAddress}_${getExportName()}`,
      months,
      productRows,
      monthlyTotals,
      grandTotal,
      getChangePercent,
    );
  };

  const exportChartsToPdf = async () => {
    let chartGroups = document.querySelectorAll(`.${styles.chartGroup}`);

    if (chartGroups.length === 0) {
      const dynamicCharts = document.querySelector(`.${styles.dynamicCharts}`);
      if (dynamicCharts) {
        chartGroups = dynamicCharts.querySelectorAll(`.${styles.chartGroup}`);
      }
    }

    if (chartGroups.length === 0) {
      chartGroups = document.querySelectorAll('[class*="chartGroup"]');
    }

    if (chartGroups.length === 0) {
      console.error('No chart groups found');
      return;
    }

    setExportingChartsPdf(true);

    try {
      const chartFileName = `Графики_${getExportName()}_${selectedAddress}_${new Date().toLocaleDateString('ru-RU')}`;

      await chartExportService.exportAllChartsToPdf(
        chartGroups,
        chartFileName,
        isMobile,
        {
          quality: chartQuality,
          format: chartFormat,
          onProgress: (current, total) => {
            console.log(`Processing chart ${current} of ${total}`);
          },
        }
      );
    } catch (error) {
      console.error('Error exporting charts to PDF:', error);
      setError('Ошибка при создании PDF с графиками');
    } finally {
      setExportingChartsPdf(false);
    }
  };

  const handleExportPDF = async () => {
    if (productRows.length === 0) return;

    setPdfExporting(true);
    setError(null);

    try {
      const rowsPerPage = isMobile ? 15 : 20;

      if (reportType === 'desserts') {
        await pdfExportDessertsService.exportDessertsToPdf(
          topProducts,
          additionalProducts,
          months,
          selectedAddress,
          {
            rowsPerPage,
            fileName: `Десерты_${selectedAddress}_${new Date().toLocaleDateString('ru-RU')}`,
            quality: pdfQuality,
          }
        );
      } else {
        await pdfExportUniversalService.exportToPdf(
          productRows,
          months,
          selectedAddress,
          getReportTitle(),
          {
            rowsPerPage,
            fileName: `${getReportTitle()}_${selectedAddress}_${new Date().toLocaleDateString('ru-RU')}`,
            quality: pdfQuality,
          }
        );
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Ошибка при экспорте в PDF.');
    } finally {
      setPdfExporting(false);
    }
  };

  const { topProducts, additionalProducts, hasAdditionalProducts } = useMemo(() => {
    if (reportType !== 'desserts') {
      return { topProducts: productRows, additionalProducts: [], hasAdditionalProducts: false };
    }

    const sorted = [...productRows].sort((a, b) => b.totalCount - a.totalCount);
    const top = sorted.slice(0, 30);
    const additional = sorted.slice(30);

    return {
      topProducts: top,
      additionalProducts: additional,
      hasAdditionalProducts: additional.length > 0
    };
  }, [productRows, reportType]);

  const renderCombinedCell = (
    currentData: { count: number; sum: number },
    previousData: { count: number; sum: number } | null,
    monthIndex: number,
  ) => {
    const count = currentData?.count || 0;
    const sum = currentData?.sum || 0;

    let percentChange: number | null = null;
    if (monthIndex > 0 && previousData && previousData.sum > 0) {
      percentChange = getChangePercent(currentData?.sum || 0, previousData.sum);
    }

    return (
      <td className={styles.combinedCell}>
        <div className={styles.combinedCellContent}>
          <div className={styles.countRow}>{formatNumber(count)}</div>
          <div className={styles.sumRow}>{formatCurrency(sum)}</div>
          {percentChange !== null && (
            <div className={`${styles.changeRow} ${percentChange >= 0 ? styles.positive : styles.negative}`}>
              {formatPercent(percentChange)}
            </div>
          )}
        </div>
      </td>
    );
  };

  const renderTable = (rows: any[], title?: string, showTotalRow: boolean = true, tableId?: string) => {
    if (rows.length === 0) return null;

    const currentFontSize = fullscreenTable === tableId ? fullscreenFontSize : fontSize;

    return (
      <div className={styles.tableSection} ref={(el) => {
        if (el && tableId) {
          tableRefs.current.set(tableId, el);
        }
      }}>
        <div className={styles.tableHeader}>
          {title && <h3 className={styles.tableTitle}>{title}</h3>}
          {fullscreenTable !== tableId && (
            <button
              className={styles.fullscreenTableButton}
              onClick={() => setFullscreenTable(tableId!)}
              title="Открыть в полноэкранном режиме"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.reportTable} style={{ '--reports-table-font-size': `${currentFontSize}px` } as React.CSSProperties}>
            <thead>
            <tr>
              <th className={styles.productColumn}>Товар</th>
              {months.map(month => (
                <th key={month.key} className={styles.monthHeader}>
                  {month.label}
                </th>
              ))}
              <th className={styles.totalHeader}>Итого</th>
            </tr>
            </thead>
            <tbody>
            {rows.map(product => {
              const monthEntries = months.map((month, index) => ({
                month,
                data: product.months[month.key] || { count: 0, sum: 0 },
                previousData: index > 0 ? product.months[months[index - 1].key] || { count: 0, sum: 0 } : null,
              }));

              return (
                <tr key={product.productName}>
                  <td className={styles.productCell}>
                    {product.productName}
                  </td>
                  {monthEntries.map((entry, idx) => (
                    <React.Fragment key={entry.month.key}>
                      {renderCombinedCell(entry.data, entry.previousData, idx)}
                    </React.Fragment>
                  ))}
                  <td className={styles.totalCell}>
                    <div className={styles.totalCellContent}>
                      <div className={styles.totalCountRow}>{formatNumber(product.totalCount)}</div>
                      <div className={styles.totalSumRow}>{formatCurrency(product.totalSum)}</div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {showTotalRow && (
              <tr className={styles.totalRow}>
                <td className={styles.productCell}>ИТОГО</td>
                {months.map((month, idx) => {
                  const currentTotal = rows.reduce((acc, product) => {
                    const data = product.months[month.key] || { count: 0, sum: 0 };
                    return {
                      count: acc.count + data.count,
                      sum: acc.sum + data.sum
                    };
                  }, { count: 0, sum: 0 });

                  const previousTotal = idx > 0 ? rows.reduce((acc, product) => {
                    const data = product.months[months[idx - 1].key] || { count: 0, sum: 0 };
                    return {
                      count: acc.count + data.count,
                      sum: acc.sum + data.sum
                    };
                  }, { count: 0, sum: 0 }) : null;

                  return (
                    <React.Fragment key={month.key}>
                      {renderCombinedCell(currentTotal, previousTotal, idx)}
                    </React.Fragment>
                  );
                })}
                <td className={styles.totalCell}>
                  <div className={styles.totalCellContent}>
                    <div className={styles.totalCountRow}>
                      {formatNumber(rows.reduce((sum, p) => sum + p.totalCount, 0))}
                    </div>
                    <div className={styles.totalSumRow}>
                      {formatCurrency(rows.reduce((sum, p) => sum + p.totalSum, 0))}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (productRows.length === 0) {
      return (
        <div className={styles.noData}>
          <p>Нет данных для отображения</p>
        </div>
      );
    }

    if (reportType === 'desserts') {
      return (
        <>
          {renderTable(topProducts, 'Основная матрица (Топ-30)', true, 'main-matrix')}
          {hasAdditionalProducts && (
            <>
              <div className={styles.additionalToggle}>
                <button
                  className={styles.toggleButton}
                  onClick={() => setShowAdditionalAssortment(!showAdditionalAssortment)}
                >
                  {showAdditionalAssortment ? <ArrowDown size={18} /> : <ArrowRight size={18} />}
                  Дополнительный ассортимент ({additionalProducts.length} товаров)
                </button>
              </div>
              {showAdditionalAssortment && renderTable(additionalProducts, '', true, 'additional-assortment')}
            </>
          )}
        </>
      );
    }

    return renderTable(productRows, `Таблица продаж: ${getReportTitle()}`, true, 'main-table');
  };

  // Полноэкранный режим
  if (fullscreenTable) {
    const currentFontSize = fullscreenFontSize;

    return (
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenHeader}>
          <div className={styles.fullscreenTitle}>
            <span>Таблица продаж - {getReportTitle()}</span>
            <span className={styles.fullscreenAddress}>{selectedAddress}</span>
          </div>
          <div className={styles.fullscreenControls}>
            <div className={styles.fontSizeControls}>
              <button
                className={styles.fontSizeButton}
                onClick={decreaseFontSize}
                disabled={fullscreenFontSize <= 8}
                title="Уменьшить шрифт"
              >
                <ZoomOut size={18} />
              </button>
              <span className={styles.fontSizeValue}>{fullscreenFontSize}px</span>
              <button
                className={styles.fontSizeButton}
                onClick={increaseFontSize}
                disabled={fullscreenFontSize >= 18}
                title="Увеличить шрифт"
              >
                <ZoomIn size={18} />
              </button>
            </div>
            <button
              className={styles.fullscreenCloseButton}
              onClick={() => setFullscreenTable(null)}
              title="Закрыть полноэкранный режим"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
        <div className={styles.fullscreenContent}>
          <div className={styles.tableContainer}>
            <table className={styles.reportTable} style={{ '--reports-table-font-size': `${currentFontSize}px` } as React.CSSProperties}>
              <thead>
              <tr>
                <th className={styles.productColumn}>Товар</th>
                {months.map(month => (
                  <th key={month.key} className={styles.monthHeader}>
                    {month.label}
                  </th>
                ))}
                <th className={styles.totalHeader}>Итого</th>
              </tr>
              </thead>
              <tbody>
              {(fullscreenTable === 'main-matrix' ? topProducts :
                fullscreenTable === 'additional-assortment' ? additionalProducts : productRows).map(product => {
                const monthEntries = months.map((month, index) => ({
                  month,
                  data: product.months[month.key] || { count: 0, sum: 0 },
                  previousData: index > 0 ? product.months[months[index - 1].key] || { count: 0, sum: 0 } : null,
                }));

                return (
                  <tr key={product.productName}>
                    <td className={styles.productCell}>
                      {product.productName}
                    </td>
                    {monthEntries.map((entry, idx) => (
                      <React.Fragment key={entry.month.key}>
                        {renderCombinedCell(entry.data, entry.previousData, idx)}
                      </React.Fragment>
                    ))}
                    <td className={styles.totalCell}>
                      <div className={styles.totalCellContent}>
                        <div className={styles.totalCountRow}>{formatNumber(product.totalCount)}</div>
                        <div className={styles.totalSumRow}>{formatCurrency(product.totalSum)}</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className={styles.totalRow}>
                <td className={styles.productCell}>ИТОГО</td>
                {months.map((month, idx) => {
                  const rows = fullscreenTable === 'main-matrix' ? topProducts :
                    fullscreenTable === 'additional-assortment' ? additionalProducts : productRows;
                  const currentTotal = rows.reduce((acc, product) => {
                    const data = product.months[month.key] || { count: 0, sum: 0 };
                    return {
                      count: acc.count + data.count,
                      sum: acc.sum + data.sum
                    };
                  }, { count: 0, sum: 0 });

                  const previousTotal = idx > 0 ? rows.reduce((acc, product) => {
                    const data = product.months[months[idx - 1].key] || { count: 0, sum: 0 };
                    return {
                      count: acc.count + data.count,
                      sum: acc.sum + data.sum
                    };
                  }, { count: 0, sum: 0 }) : null;

                  return (
                    <React.Fragment key={month.key}>
                      {renderCombinedCell(currentTotal, previousTotal, idx)}
                    </React.Fragment>
                  );
                })}
                <td className={styles.totalCell}>
                  <div className={styles.totalCellContent}>
                    <div className={styles.totalCountRow}>
                      {formatNumber((fullscreenTable === 'main-matrix' ? topProducts :
                        fullscreenTable === 'additional-assortment' ? additionalProducts : productRows).reduce((sum, p) => sum + p.totalCount, 0))}
                    </div>
                    <div className={styles.totalSumRow}>
                      {formatCurrency((fullscreenTable === 'main-matrix' ? topProducts :
                        fullscreenTable === 'additional-assortment' ? additionalProducts : productRows).reduce((sum, p) => sum + p.totalSum, 0))}
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

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

  const chartsContent = !fullscreenTable && productRows.length > 0 && (
    <DynamicCharts
      productRows={productRows}
      months={months}
      isMobile={isMobile}
      reportType={reportType}
    />
  );

  // Обычный режим
  return (
    <div className={styles.reportsView}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack} title="Назад к выбору отчета">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2 className={styles.reportTitle}>Отчет по продажам: {getReportTitle()}</h2>
      </div>

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
              disabled={fontSize <= 8}
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
        </div>
        <div className={styles.exportButtons}>
          <button
            className={styles.exportChartsPdfButton}
            onClick={exportChartsToPdf}
            disabled={productRows.length === 0 || exportingChartsPdf}
            title="Экспорт графиков в PDF"
          >
            {exportingChartsPdf ? (
              <Loader size={18} className={styles.spinnerSmall} />
            ) : (
              <ChartLine size={18} />
            )}
            <span>Графики</span>
          </button>
          <button
            className={styles.exportPdfButton}
            onClick={handleExportPDF}
            disabled={productRows.length === 0 || pdfExporting}
            title="Экспорт таблицы в PDF"
          >
            {pdfExporting ? (
              <Loader size={18} className={styles.spinnerSmall} />
            ) : (
              <Table size={18} />
            )}
            <span>Таблица</span>
          </button>
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
        <div className={styles.scrollableContent}>
          {renderContent()}
          {chartsContent}
        </div>
      )}
    </div>
  );
};

export default ReportsView;