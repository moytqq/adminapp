'use client';

import React, { useRef, useState } from 'react';
import { Play, AlertCircle, CheckCircle, AlertTriangle, Info, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/services/api';
import styles from './OrdersCalculation.module.scss';

interface CalcLogEntry {
  level: 'info' | 'warn' | 'error' | 'success';
  address: string;
  sku_id: number;
  sku_name: string;
  message: string;
}

interface CalcSummary {
  addresses: number;
  items_ok: number;
  items_warn: number;
  items_error: number;
}

interface CalcResult {
  logs: CalcLogEntry[];
  ordersCreated: number;
  orderId: string | null;
  summary: CalcSummary;
}

interface Props {
  onBack?: () => void;
}

const LEVEL_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle size={14} />,
  error: <AlertCircle size={14} />,
  warn: <AlertTriangle size={14} />,
  info: <Info size={14} />,
};

const OrdersCalculation: React.FC<Props> = ({ onBack }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set());
  const logsRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await api.post('/orders/calculate', { dry_run: dryRun });
      setResult(res.data);
      // авто-раскрытие адресов с ошибками
      const errAddresses = new Set(
        (res.data.logs as CalcLogEntry[])
          .filter(l => l.level === 'error')
          .map(l => l.address)
          .filter(Boolean),
      );
      setExpandedAddresses(errAddresses);
      setTimeout(() => logsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: any) {
      setResult({
        logs: [{ level: 'error', address: '', sku_id: 0, sku_name: '', message: e?.response?.data?.message || 'Ошибка запроса к серверу' }],
        ordersCreated: 0,
        orderId: null,
        summary: { addresses: 0, items_ok: 0, items_warn: 0, items_error: 1 },
      });
    } finally {
      setRunning(false);
    }
  };

  // Группируем логи по адресу
  const groupedLogs = React.useMemo(() => {
    if (!result) return [];
    const groups: { address: string; label: string; entries: CalcLogEntry[] }[] = [];
    let current: { address: string; label: string; entries: CalcLogEntry[] } | null = null;

    for (const entry of result.logs) {
      if (entry.level === 'info' && entry.message.startsWith('━━━ Адрес')) {
        if (current) groups.push(current);
        current = { address: entry.address, label: entry.message, entries: [] };
      } else if (!current) {
        // глобальные логи (до первого адреса или после)
        if (groups.length === 0) groups.push({ address: '__global__', label: 'Общие', entries: [] });
        groups[0].entries.push(entry);
      } else {
        current.entries.push(entry);
      }
    }
    if (current) groups.push(current);
    return groups;
  }, [result]);

  const filteredGroups = React.useMemo(() => {
    if (filterLevel === 'all') return groupedLogs;
    return groupedLogs
      .map(g => ({ ...g, entries: g.entries.filter(e => e.level === filterLevel) }))
      .filter(g => g.entries.length > 0);
  }, [groupedLogs, filterLevel]);

  const toggleAddress = (addr: string) => {
    setExpandedAddresses(prev => {
      const next = new Set(prev);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });
  };

  const expandAll = () => setExpandedAddresses(new Set(groupedLogs.map(g => g.address)));
  const collapseAll = () => setExpandedAddresses(new Set());

  return (
    <div className={styles.container}>
      {onBack && (
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
      )}

      <div className={styles.controlPanel}>
        <div className={styles.controlLeft}>
          <h2 className={styles.title}>Расчёт автозаказов</h2>
          <p className={styles.subtitle}>
            Расчёт на основе суточного расхода, НЗ и графика поставщиков.
            Текущие остатки не учитываются — заказ рассчитывается на поддержание НЗ.
          </p>
        </div>

        <div className={styles.controlRight}>
          <label className={styles.dryRunToggle}>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
              disabled={running}
            />
            <span>Пробный запуск (без сохранения)</span>
          </label>

          <button
            className={styles.runBtn}
            onClick={run}
            disabled={running}
          >
            <Play size={16} />
            <span>{running ? 'Расчёт...' : dryRun ? 'Проверить' : 'Рассчитать и сохранить'}</span>
          </button>
        </div>
      </div>

      {result && (
        <>
          {/* Сводка */}
          <div className={styles.summary}>
            <div className={`${styles.summaryCard} ${styles.cardAddresses}`}>
              <div className={styles.summaryValue}>{result.summary.addresses}</div>
              <div className={styles.summaryLabel}>адресов</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardOk}`}>
              <div className={styles.summaryValue}>{result.summary.items_ok}</div>
              <div className={styles.summaryLabel}>рассчитано</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardWarn}`}>
              <div className={styles.summaryValue}>{result.summary.items_warn}</div>
              <div className={styles.summaryLabel}>предупреждений</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.cardErr}`}>
              <div className={styles.summaryValue}>{result.summary.items_error}</div>
              <div className={styles.summaryLabel}>ошибок</div>
            </div>
            {result.orderId && (
              <div className={`${styles.summaryCard} ${styles.cardSaved}`}>
                <div className={styles.summaryValue}>{result.ordersCreated}</div>
                <div className={styles.summaryLabel}>сохранено</div>
              </div>
            )}
          </div>

          {result.orderId && (
            <div className={styles.savedBanner}>
              ✅ Заказ сохранён, ID: <strong>{result.orderId}</strong>
            </div>
          )}

          {/* Фильтр + кнопки */}
          <div className={styles.logsToolbar} ref={logsRef}>
            <div className={styles.filterBtns}>
              {(['all', 'error', 'warn', 'success', 'info'] as const).map(lvl => (
                <button
                  key={lvl}
                  className={`${styles.filterBtn} ${filterLevel === lvl ? styles[`active_${lvl}`] : ''}`}
                  onClick={() => setFilterLevel(lvl)}
                >
                  {lvl === 'all' ? 'Все' : lvl === 'error' ? '❌ Ошибки' : lvl === 'warn' ? '⚠️ Предупреждения' : lvl === 'success' ? '✅ OK' : 'ℹ️ Инфо'}
                </button>
              ))}
            </div>
            <div className={styles.expandBtns}>
              <button className={styles.expandBtn} onClick={expandAll}>Раскрыть все</button>
              <button className={styles.expandBtn} onClick={collapseAll}>Свернуть все</button>
            </div>
          </div>

          {/* Логи */}
          <div className={styles.logs}>
            {filteredGroups.map(group => {
              const isOpen = expandedAddresses.has(group.address);
              const hasErrors = group.entries.some(e => e.level === 'error');
              const hasWarns = group.entries.some(e => e.level === 'warn');
              const isGlobal = group.address === '__global__';

              return (
                <div key={group.address} className={styles.addressGroup}>
                  {!isGlobal && (
                    <button
                      className={`${styles.groupHeader} ${hasErrors ? styles.groupHeaderErr : hasWarns ? styles.groupHeaderWarn : styles.groupHeaderOk}`}
                      onClick={() => toggleAddress(group.address)}
                    >
                      <span className={styles.groupTitle}>{group.address} · {group.label.replace(/━━━ Адрес \w+: /, '').replace(' ━━━', '')}</span>
                      <span className={styles.groupMeta}>
                        {group.entries.filter(e => e.level === 'error').length > 0 && <span className={styles.badge_err}>❌ {group.entries.filter(e => e.level === 'error').length}</span>}
                        {group.entries.filter(e => e.level === 'warn').length > 0 && <span className={styles.badge_warn}>⚠️ {group.entries.filter(e => e.level === 'warn').length}</span>}
                        {group.entries.filter(e => e.level === 'success').length > 0 && <span className={styles.badge_ok}>✅ {group.entries.filter(e => e.level === 'success').length}</span>}
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                  )}

                  {(isGlobal || isOpen) && (
                    <div className={styles.groupEntries}>
                      {group.entries.map((entry, i) => (
                        <div key={i} className={`${styles.logEntry} ${styles[`level_${entry.level}`]}`}>
                          <span className={styles.logIcon}>{LEVEL_ICON[entry.level]}</span>
                          <span className={styles.logText}>
                            {entry.sku_name && <strong>{entry.sku_name}: </strong>}
                            {entry.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersCalculation;
