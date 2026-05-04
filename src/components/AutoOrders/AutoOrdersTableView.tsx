'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { autoOrdersApi, OrderAccess, OrderItem, AddressItem, SupplierItem } from '@/services/autoOrdersApi';
import ItemSelector, { SelectorItem } from './ItemSelector';
import styles from './AutoOrdersTableView.module.scss';
import {
  Loader,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Table,
  Calendar,
} from 'lucide-react';
import { pdfExportAutoOrdersService } from '@/services/pdfExportAutoOrdersService';

interface AutoOrdersTableViewProps {
  autoOrderType: string;
  onBack?: () => void;
}

interface OrderMonth {
  id: number;
  name: string;
  orderId: string;
  startDay: string;
  endDay: string;
}

interface Week {
  label: string;
  startDate: string;
  endDate: string;
}

interface SelectOption {
  value: string;
  label: string;
  type: 'address' | 'supplier';
}

interface GroupedItem {
  groupKey: string;
  groupName: string;
  items: OrderItem[];
  totalCount: number;
  address?: string;
  addressFull?: string;
  addressIp?: string;
}

const AutoOrdersTableView: React.FC<AutoOrdersTableViewProps> = ({ autoOrderType, onBack }) => {
  const [months, setMonths] = useState<OrderMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<OrderMonth | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'address' | 'supplier' | null>(null);
  const [data, setData] = useState<OrderItem[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
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
    loadMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadAddressesAndSuppliers();
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth && selectedValue && selectedType && selectedWeek) {
      loadData();
    }
  }, [selectedMonth, selectedValue, selectedType, selectedWeek]);

  const loadMonths = async () => {
    setLoadingMonths(true);
    try {
      const data = await autoOrdersApi.getOrderAccess();
      const monthsData: OrderMonth[] = data.map(item => ({
        id: item.id,
        name: item.name,
        orderId: item.order_id,
        startDay: item.start_day,
        endDay: item.end_day,
      }));
      setMonths(monthsData);
    } catch (err) {
      console.error('Error loading months:', err);
      setError('Ошибка при загрузке месяцев');
    } finally {
      setLoadingMonths(false);
    }
  };

  const loadAddressesAndSuppliers = async () => {
    if (!selectedMonth) return;

    setLoadingOptions(true);
    try {
      const [addressesData, suppliersData] = await Promise.all([
        autoOrdersApi.getAddressList(selectedMonth.orderId),
        autoOrdersApi.getSupplierList(selectedMonth.orderId),
      ]);

      setAddresses(addressesData);
      setSuppliers(suppliersData);

      const options: SelectOption[] = [
        ...addressesData.map(addr => ({
          value: addr.address_id,
          label: addr.address_name,
          type: 'address' as const,
        })),
        ...suppliersData.map(sup => ({
          value: sup.supplier_id,
          label: sup.supplier_name,
          type: 'supplier' as const,
        })),
      ];
      setSelectOptions(options);
    } catch (err) {
      console.error('Error loading addresses/suppliers:', err);
      setError('Ошибка при загрузке адресов и поставщиков');
    } finally {
      setLoadingOptions(false);
    }
  };

  const generateWeeks = (startDate: string, endDate: string): Week[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weeks: Week[] = [];

    weeks.push({
      label: 'За весь месяц',
      startDate: startDate,
      endDate: endDate,
    });

    let currentStart = new Date(start);

    while (currentStart <= end) {
      const weekEnd = new Date(currentStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const actualEnd = weekEnd > end ? end : weekEnd;

      weeks.push({
        label: `${currentStart.toLocaleDateString('ru-RU')} - ${actualEnd.toLocaleDateString('ru-RU')}`,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: actualEnd.toISOString().split('T')[0],
      });

      currentStart.setDate(currentStart.getDate() + 7);
    }

    return weeks;
  };

  const loadData = async () => {
    if (!selectedMonth || !selectedValue || !selectedType || !selectedWeek) return;

    setLoadingData(true);
    setError(null);
    try {
      let result: OrderItem[];

      if (selectedWeek.label === 'За весь месяц') {
        if (selectedType === 'address') {
          result = await autoOrdersApi.getOrdersByAddress(
            selectedMonth.orderId,
            selectedValue,
            selectedMonth.startDay.split('T')[0],
            selectedMonth.endDay.split('T')[0]
          );
        } else {
          result = await autoOrdersApi.getOrdersBySupplier(
            selectedMonth.orderId,
            selectedValue,
            selectedMonth.startDay.split('T')[0],
            selectedMonth.endDay.split('T')[0]
          );
        }
      } else {
        if (selectedType === 'address') {
          result = await autoOrdersApi.getOrdersByAddress(
            selectedMonth.orderId,
            selectedValue,
            selectedWeek.startDate,
            selectedWeek.endDate
          );
        } else {
          result = await autoOrdersApi.getOrdersBySupplier(
            selectedMonth.orderId,
            selectedValue,
            selectedWeek.startDate,
            selectedWeek.endDate
          );
        }
      }
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectMonth = (month: OrderMonth) => {
    setSelectedMonth(month);
    setSelectedValue(null);
    setSelectedType(null);
    setData([]);

    const weeksData = generateWeeks(month.startDay, month.endDay);
    setWeeks(weeksData);
    setSelectedWeek(weeksData[0]);
  };

  const handleSelectOption = (value: string) => {
    const option = selectOptions.find(opt => opt.value === value);
    if (option) {
      setSelectedValue(option.value);
      setSelectedType(option.type);
      if (weeks.length > 0 && !selectedWeek) {
        setSelectedWeek(weeks[0]);
      }
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

  const handleExportExcel = () => {
    if (data.length === 0) return;
    console.log('Export to Excel');
  };

  const handleExportPDF = async () => {
    if (groupedData.length === 0) return;
    if (!selectedMonth) return;
    if (!selectedType) return;
    if (!selectedWeek) return;

    setPdfExporting(true);
    setError(null);

    try {
      const selectedOptionLabel = selectOptions.find(opt => opt.value === selectedValue)?.label || '';

      await pdfExportAutoOrdersService.exportAutoOrdersToPdf(
        groupedData,
        selectedMonth.name,
        selectedType,
        selectedOptionLabel,
        selectedWeek.label,
        {
          fileName: `Автозаказы_${selectedMonth.name}_${selectedOptionLabel}_${new Date().toLocaleDateString('ru-RU')}`,
        }
      );
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Ошибка при экспорте в PDF');
    } finally {
      setPdfExporting(false);
    }
  };

  const groupedData = useMemo((): GroupedItem[] => {
    if (data.length === 0 || !selectedType) return [];

    const groupsMap = new Map<string, {
      items: OrderItem[];
      address?: string;
      addressFull?: string;
      addressIp?: string;
    }>();

    if (selectedType === 'address') {
      data.forEach(item => {
        const key = item.supplier;
        if (!groupsMap.has(key)) {
          groupsMap.set(key, {
            items: [],
          });
        }
        groupsMap.get(key)!.items.push(item);
      });
    } else {
      data.forEach(item => {
        const key = item.address;
        if (!groupsMap.has(key)) {
          groupsMap.set(key, {
            items: [],
            address: item.address,
            addressFull: item.address_full,
            addressIp: item.address_ip,
          });
        }
        groupsMap.get(key)!.items.push(item);
      });
    }

    const result: GroupedItem[] = [];
    for (const [key, group] of groupsMap) {
      const totalCount = group.items.reduce((sum, item) => sum + item.count, 0);
      const groupName = selectedType === 'address'
        ? group.items[0]?.supplier_name || key
        : key;

      result.push({
        groupKey: key,
        groupName: groupName,
        items: group.items,
        totalCount: totalCount,
        address: group.address,
        addressFull: group.addressFull,
        addressIp: group.addressIp,
      });
    }

    return result.sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [data, selectedType]);

  const renderTable = (group: GroupedItem, index: number) => {
    const currentFontSize = fullscreenTable === `table-${index}` ? fullscreenFontSize : fontSize;

    return (
      <div key={group.groupKey} className={styles.tableSection} ref={(el) => {
        if (el) tableRefs.current.set(`table-${index}`, el);
      }}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>
            {selectedType === 'address' ? 'Поставщик' : 'Адрес'}: {group.groupName}
            <span className={styles.totalCount}> (Всего: {group.totalCount} шт.)</span>
          </h3>
          {fullscreenTable !== `table-${index}` && (
            <button
              className={styles.fullscreenTableButton}
              onClick={() => setFullscreenTable(`table-${index}`)}
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
              <th className={styles.productColumn}>Наименование</th>
              <th className={styles.countColumn}>Кол-во</th>
              <th className={styles.packagingColumn}>Фасовка</th>
              <th className={styles.dateColumn}>Дата</th>
            </tr>
            </thead>
            <tbody>
            {group.items.map(item => (
              <tr key={item.id}>
                <td className={styles.productCell}>{item.product_name}</td>
                <td className={styles.countCell}>{item.count}</td>
                <td className={styles.packagingCell}>{item.packaging_supplier}</td>
                <td className={styles.dateCell}>{new Date(item.date).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!selectedMonth) {
    const monthItems: SelectorItem[] = months.map(month => ({
      id: month.id,
      name: month.name,
      description: `${new Date(month.startDay).toLocaleDateString('ru-RU')} - ${new Date(month.endDay).toLocaleDateString('ru-RU')}`,
      icon: <Calendar size={28} />,
    }));

    return (
      <ItemSelector
        title="В работе"
        subtitle="Выберите месяц для просмотра заказов"
        items={monthItems}
        onSelect={(item) => {
          const month = months.find(m => m.id === Number(item.id));
          if (month) handleSelectMonth(month);
        }}
        loading={loadingMonths}
        onBack={onBack}
        showBackButton={true}
      />
    );
  }

  // Полноэкранный режим
  if (fullscreenTable) {
    const tableIndex = parseInt(fullscreenTable.split('-')[1]);
    const group = groupedData[tableIndex];
    const currentFontSize = fullscreenFontSize;

    if (!group) {
      setFullscreenTable(null);
      return null;
    }

    return (
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenHeader}>
          <div className={styles.fullscreenTitle}>
            <span>{selectedMonth.name} - {selectedType === 'address' ? 'Поставщик' : 'Адрес'}: {group.groupName}</span>
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
            <table className={styles.reportTable} style={{ '--reports-table-font-size': `${currentFontSize}px` } as React.CSSProperties}>
              <thead>
              <tr>
                <th className={styles.productColumn}>Наименование</th>
                <th className={styles.countColumn}>Кол-во</th>
                <th className={styles.packagingColumn}>Фасовка</th>
                <th className={styles.dateColumn}>Дата</th>
              </tr>
              </thead>
              <tbody>
              {group.items.map(item => (
                <tr key={item.id}>
                  <td className={styles.productCell}>{item.product_name}</td>
                  <td className={styles.countCell}>{item.count}</td>
                  <td className={styles.packagingCell}>{item.packaging_supplier}</td>
                  <td className={styles.dateCell}>{new Date(item.date).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const selectedOptionLabel = selectOptions.find(opt => opt.value === selectedValue)?.label || '';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="typeSelectorBackButtonGray" onClick={() => setSelectedMonth(null)} title="Назад к месяцам">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </button>
        <h2 className={styles.title}>{selectedMonth.name}</h2>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Адрес/Поставщик:</label>
          <select
            className={styles.select}
            value={selectedValue || ''}
            onChange={(e) => handleSelectOption(e.target.value)}
            disabled={loadingOptions}
          >
            <option value="">Выберите адрес или поставщика</option>
            {selectOptions.length > 0 && (
              <>
                <optgroup label="Адреса">
                  {selectOptions.filter(opt => opt.type === 'address').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Поставщики">
                  {selectOptions.filter(opt => opt.type === 'supplier').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>

        {selectedValue && weeks.length > 0 && (
          <div className={styles.filterGroup}>
            <label>Период:</label>
            <select
              className={styles.select}
              value={selectedWeek ? `${selectedWeek.startDate}|${selectedWeek.endDate}` : ''}
              onChange={(e) => {
                const [startDate, endDate] = e.target.value.split('|');
                const week = weeks.find(w => w.startDate === startDate && w.endDate === endDate);
                if (week) setSelectedWeek(week);
              }}
            >
              {weeks.map(week => (
                <option key={`${week.startDate}|${week.endDate}`} value={`${week.startDate}|${week.endDate}`}>
                  {week.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <label>Размер шрифта:</label>
          <div className={styles.fontSizeControls}>
            <button className={styles.fontSizeButton} onClick={decreaseFontSize} disabled={fontSize <= 8}>
              <ZoomOut size={16} />
            </button>
            <span className={styles.fontSizeValue}>{fontSize}px</span>
            <button className={styles.fontSizeButton} onClick={increaseFontSize} disabled={fontSize >= 18}>
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className={styles.exportButtons}>
          <button
            className={styles.exportPdfButton}
            onClick={handleExportPDF}
            disabled={data.length === 0 || pdfExporting}
          >
            {pdfExporting ? <Loader size={18} className={styles.spinnerSmall} /> : <Table size={18} />}
            <span>PDF</span>
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className={styles.loading}>
          <Loader size={48} className={styles.spinner} />
          <p>Загрузка данных...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => loadData()}>Повторить</button>
        </div>
      ) : data.length === 0 && selectedValue ? (
        <div className={styles.noData}>
          <p>Нет данных для отображения</p>
        </div>
      ) : groupedData.length > 0 ? (
        <div className={styles.tablesWrapper}>
          {groupedData.map((group, index) => renderTable(group, index))}
        </div>
      ) : null}
    </div>
  );
};

export default AutoOrdersTableView;