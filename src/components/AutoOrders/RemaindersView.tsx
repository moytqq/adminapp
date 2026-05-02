'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { remaindersApi, RemainderForm, RemainderField, SkuInfo, SaveRemainderItem } from '@/services/remaindersApi';
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
      // Загружаем поля формы
      const fieldsData = await remaindersApi.getFieldsByRegId(form.id);
      setFields(fieldsData);

      // Собираем все sku_id
      const skuIds = Object.values(fieldsData).map(field => field.sku_id);

      // Загружаем информацию о товарах
      const skusData = await remaindersApi.getSkusByIds(skuIds);
      const skusMap = new Map<number, SkuInfo>();
      skusData.forEach(sku => {
        skusMap.set(sku.sku_id, sku);
      });
      setSkusInfo(skusMap);

      // Формируем данные для таблицы
      const rows: RemainderRow[] = Object.values(fieldsData).map(field => ({
        skuId: field.sku_id,
        productName: skusMap.get(field.sku_id)?.name || `Товар ${field.sku_id}`,
        packaging: skusMap.get(field.sku_id)?.packaging_supplier || '',
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

  const handleValueChange = (skuId: number, newValue: string) => {
    // Разрешаем только цифры
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
        if (row.value && parseInt(row.value) > 0) {
          filledItems.push({
            address: form.address,
            sku_id: row.skuId,
            value: parseInt(row.value),
            date: dateToSend,
          });
        } else if (row.value === '' || (row.value && parseInt(row.value) === 0)) {
          const productName = skusInfo.get(row.skuId)?.name || `Товар ${row.skuId}`;
          emptyItems.push(productName);
        }
      }

      // Показываем предупреждение о незаполненных полях
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

        // Обновляем originalValue для всех сохранённых строк
        setTableData(prev => prev.map(row => {
          const savedItem = filledItems.find(item => item.sku_id === row.skuId);
          if (savedItem) {
            return { ...row, originalValue: savedItem.value, value: savedItem.value.toString() };
          }
          return { ...row, originalValue: undefined };
        }));

        // Скрываем сообщение через 3 секунды
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
            <table className={styles.reportTable} style={{ '--reports-table-font-size': `${currentFontSize}px` } as React.CSSProperties}>
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
                      placeholder="0"
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
              <table className={styles.reportTable} style={{ '--reports-table-font-size': `${fullscreenFontSize}px` } as React.CSSProperties}>
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
                        placeholder="0"
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
        </div>
        <div className={styles.rightControls}>
          {/*{unsavedChanges && (
            <span className={styles.unsavedIndicator}>
              <AlertTriangle size={16} />
              Есть несохранённые изменения
            </span>
          )}*/}
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
      </div>
    </div>
  );
};

export default RemaindersView;