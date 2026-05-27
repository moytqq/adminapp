'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { remaindersApi, RemainderForm, RemainderField, SkuInfo, SaveRemainderItem, LastStockItem } from '@/services/remaindersApi';
import styles from './RemaindersView.module.scss';
import {
  Loader,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Save,
  AlertTriangle,
  History,
} from 'lucide-react';

interface RemaindersViewProps {
  form: RemainderForm;
  onBack: () => void;
}

interface RemainderRow {
  skuId: number;
  productName: string;
  packaging: string;
  value: string;
  originalValue?: number;
}

const RemaindersView: React.FC<RemaindersViewProps> = ({ form, onBack }) => {
  const [fields, setFields] = useState<RemainderField | null>(null);
  const [skusInfo, setSkusInfo] = useState<Map<number, SkuInfo>>(new Map());
  const [tableData, setTableData] = useState<RemainderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isMobile, setIsMobile] = useState(false);
  const [fullscreenTable, setFullscreenTable] = useState<string | null>(null);
  const [fullscreenFontSize, setFullscreenFontSize] = useState<number>(14);
  const tableRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const historySectionRef = useRef<HTMLDivElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<LastStockItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fieldsData = await remaindersApi.getFieldsByRegId(form.id);
      setFields(fieldsData);

      const skuIds = Object.values(fieldsData).map(field => field.sku_id);

      const skusData = await remaindersApi.getSkusByIds(skuIds);
      const skusMap = new Map<number, SkuInfo>();
      skusData.forEach(sku => {
        skusMap.set(sku.sku_id, sku);
      });
      setSkusInfo(skusMap);

      const rows: RemainderRow[] = Object.values(fieldsData).map(field => ({
        skuId: field.sku_id,
        productName: skusMap.get(field.sku_id)?.name || `Товар ${field.sku_id}`,
        packaging: skusMap.get(field.sku_id)?.packaging || '',
        value: '',
      }));
      setTableData(rows);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins  = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  const scrollToHistory = () => {
    setTimeout(() => {
      if (historySectionRef.current) {
        historySectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100); // Небольшая задержка для рендера DOM
  };

  const handleToggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setShowHistory(true);
    if (historyData.length === 0) {
      setHistoryLoading(true);
      try {
        const data = await remaindersApi.getLastStock(form.id, form.address);
        setHistoryData(data);
        // После загрузки данных прокручиваем к истории
        scrollToHistory();
      } catch {
        // ignore
      } finally {
        setHistoryLoading(false);
      }
    } else {
      // Если данные уже загружены, просто прокручиваем
      scrollToHistory();
    }
  };

  // После успешного сохранения обновляем историю
  const refreshHistory = async () => {
    try {
      const data = await remaindersApi.getLastStock(form.id, form.address);
      setHistoryData(data);
    } catch {
      // ignore
    }
  };

  const handleValueChange = (skuId: number, newValue: string) => {
    const numericValue = newValue.replace(/[^\d]/g, '');

    setTableData(prev => prev.map(row => {
      if (row.skuId === skuId) {
        const hasChanged = row.originalValue !== undefined
          ? parseInt(numericValue) !== row.originalValue
          : numericValue !== '';

        if (hasChanged) {
          setUnsavedChanges(true);
          setSuccessMessage(null);
        }

        return { ...row, value: numericValue };
      }
      return row;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const now = new Date();
      const dateToSend = now.toISOString();

      const filledItems: SaveRemainderItem[] = [];
      const emptyItems: string[] = [];

      for (const row of tableData) {
        if (row.value !== '') {
          filledItems.push({
            address: form.address,
            sku_id: row.skuId,
            value: parseInt(row.value),
            date: dateToSend,
          });
        } else {
          const productName = skusInfo.get(row.skuId)?.name || `Товар ${row.skuId}`;
          emptyItems.push(productName);
        }
      }

      if (emptyItems.length > 0) {
        const confirmMessage = `Следующие поля не заполнены:\n${emptyItems.slice(0, 10).join('\n')}${emptyItems.length > 10 ? `\n... и еще ${emptyItems.length - 10}` : ''}\n\nПродолжить сохранение?`;
        if (!window.confirm(confirmMessage)) {
          setSaving(false);
          return;
        }
      }

      if (filledItems.length === 0) {
        setError('Нет данных для сохранения');
        setSaving(false);
        return;
      }

      const response = await remaindersApi.saveRemainders(filledItems);

      if (response.status === 'success') {
        setSuccessMessage(response.message || 'Данные успешно сохранены');
        setUnsavedChanges(false);

        setTableData(prev => prev.map(row => {
          const savedItem = filledItems.find(item => item.sku_id === row.skuId);
          if (savedItem) {
            return { ...row, originalValue: savedItem.value, value: savedItem.value.toString() };
          }
          return { ...row, originalValue: undefined };
        }));

        if (showHistory) {
          refreshHistory();
        }

        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Ошибка при сохранении');
      }
    } catch (err: any) {
      console.error('Error saving data:', err);
      setError(err.message || 'Ошибка при сохранении данных');
    } finally {
      setSaving(false);
    }
  };

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

  const renderTable = () => {
    const currentFontSize = fullscreenTable === 'main-table' ? fullscreenFontSize : fontSize;

    return (
      <div className={styles.tableSection} ref={(el) => {
        if (el) tableRefs.current.set('main-table', el);
      }}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            Остатки товаров: {form.name.replace(/^[^ ]* /, '')}
          </h3>
          {fullscreenTable !== 'main-table' && (
            <button
              className={styles.fullscreenTableButton}
              onClick={() => setFullscreenTable('main-table')}
              title="Открыть в полноэкранном режиме"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>
        <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.reportTable}
                   style={{ '--reports-table-font-size': `${currentFontSize}px` } as React.CSSProperties}>
              <thead>
              <tr>
                <th className={styles.productColumn}>Наименование</th>
                <th className={styles.packagingColumn}>Фасовка</th>
                <th className={styles.valueColumn}>Остаток</th>
              </tr>
              </thead>
              <tbody>
              {tableData.map(row => (
                <tr key={row.skuId}>
                  <td className={styles.productCell}>{row.productName}</td>
                  <td className={styles.packagingCell}>{row.packaging}</td>
                  <td className={styles.valueCell}>
                    <input
                      type="text"
                      className={styles.valueInput}
                      value={row.value}
                      onChange={(e) => handleValueChange(row.skuId, e.target.value)}
                      placeholder="-"
                    />
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Полноэкранный режим
  if (fullscreenTable) {
    return (
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenHeader}>
          <div className={styles.fullscreenTitle}>
            <span>Остатки: {form.name}</span>
          </div>
          <div className={styles.fullscreenControls}>
            <div className={styles.fontSizeControls}>
              <button className={styles.fontSizeButton} onClick={decreaseFontSize} disabled={fullscreenFontSize <= 8}>
                <ZoomOut size={18} />
              </button>
              <span className={styles.fontSizeValue}>{fullscreenFontSize}px</span>
              <button className={styles.fontSizeButton} onClick={increaseFontSize} disabled={fullscreenFontSize >= 18}>
                <ZoomIn size={18} />
              </button>
            </div>
            <button className={styles.fullscreenCloseButton} onClick={() => setFullscreenTable(null)}>
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
        <div className={styles.fullscreenContent}>
          <div className={styles.tableContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.reportTable}
                     style={{ '--reports-table-font-size': `${fullscreenFontSize}px` } as React.CSSProperties}>
                <thead>
                <tr>
                  <th className={styles.productColumn}>Наименование</th>
                  <th className={styles.packagingColumn}>Фасовка</th>
                  <th className={styles.valueColumn}>Остаток</th>
                </tr>
                </thead>
                <tbody>
                {tableData.map(row => (
                  <tr key={row.skuId}>
                    <td className={styles.productCell}>{row.productName}</td>
                    <td className={styles.packagingCell}>{row.packaging}</td>
                    <td className={styles.valueCell}>
                      <input
                        type="text"
                        className={styles.valueInput}
                        value={row.value}
                        onChange={(e) => handleValueChange(row.skuId, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2 className={styles.title}>{form.name}</h2>
      </div>

      <div className={styles.controls}>
        <div className={styles.leftControls}>
          <div className={styles.fontSizeControls}>
            <button className={styles.fontSizeButton} onClick={decreaseFontSize} disabled={fontSize <= 8}>
              <ZoomOut size={18} />
            </button>
            <span className={styles.fontSizeValue}>{fontSize}px</span>
            <button className={styles.fontSizeButton} onClick={increaseFontSize} disabled={fontSize >= 18}>
              <ZoomIn size={18} />
            </button>
          </div>
          <button
            className={`${styles.historyButton} ${showHistory ? styles.historyButtonActive : ''}`}
            onClick={handleToggleHistory}
            title="Последнее внесение"
          >
            <History size={18} />
            <span>История</span>
          </button>
        </div>
        <div className={styles.rightControls}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={18} className={styles.spinnerSmall} /> : <Save size={18} />}
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}

      <div className={styles.scrollableContent}>
        {renderTable()}

        {showHistory && (
          <div ref={historySectionRef} className={`${styles.tableSection} ${styles.historySection}`}>
            <div className={styles.tableHeader}>
              <h3 className={styles.tableTitle}>
                Последнее внесение: {form.name.replace(/^[^ ]* /, '')}
              </h3>
            </div>
            <div className={styles.tableContainer}>
              <div className={styles.tableWrapper}>
                {historyLoading ? (
                  <div className={styles.historyLoading}>
                    <Loader size={24} className={styles.spinner} />
                  </div>
                ) : (
                  <table
                    className={styles.reportTable}
                    style={{ '--reports-table-font-size': `${fontSize}px` } as React.CSSProperties}
                  >
                    <thead>
                      <tr>
                        <th className={styles.productColumn}>Наименование</th>
                        <th className={styles.packagingColumn}>Фасовка</th>
                        <th className={styles.valueColumn}>Остаток</th>
                        <th className={styles.dateColumn}>Дата внесения</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map(row => {
                        const hist = historyData.find(h => h.sku_id === row.skuId);
                        return (
                          <tr key={row.skuId}>
                            <td className={styles.productCell}>{row.productName}</td>
                            <td className={styles.packagingCell}>{row.packaging}</td>
                            <td className={styles.valueCell}>
                              {hist ? hist.value : <span className={styles.noData}>—</span>}
                            </td>
                            <td className={styles.dateCell}>
                              {hist ? formatDate(hist.date) : <span className={styles.noData}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.saveButtonContainer}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader size={18} className={styles.spinnerSmall} /> : <Save size={18} />}
            <span>Сохранить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemaindersView;