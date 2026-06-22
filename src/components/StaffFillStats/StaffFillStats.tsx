'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { personalApi } from '@/services/personalApi';
import { ArrowLeft, ChevronDown, ChevronRight, Download, Search } from 'lucide-react';
import styles from './StaffFillStats.module.scss';

// Fields tracked in manager_ls_report staff data
// required: true → учитываются при подсчёте заполненности (первые 9)
const FIELDS: Array<{ key: string; label: string; group: 'main' | 'vacation' | 'dismissal'; required?: boolean }> = [
  { key: 'fio',            label: 'ФИО',                group: 'main',      required: true },
  { key: 'birthDate',      label: 'Дата рождения',      group: 'main',      required: true },
  { key: 'citizenship',    label: 'Гражданство',         group: 'main',      required: true },
  { key: 'contractType',   label: 'Тип договора',        group: 'main',      required: true },
  { key: 'phone',          label: 'Телефон',              group: 'main',      required: true },
  { key: 'startDate',      label: 'Дата начала',          group: 'main',      required: true },
  { key: 'children',       label: 'Дети',                 group: 'main',      required: true },
  { key: 'vacation1Start', label: 'Отпуск 1 нач.',        group: 'vacation',  required: true },
  { key: 'vacation1End',   label: 'Отпуск 1 кон.',        group: 'vacation',  required: true },
  { key: 'vacation2Start', label: 'Отпуск 2 нач.',        group: 'vacation' },
  { key: 'vacation2End',   label: 'Отпуск 2 кон.',        group: 'vacation' },
  { key: 'vacation3Start', label: 'Отпуск 3 нач.',        group: 'vacation' },
  { key: 'vacation3End',   label: 'Отпуск 3 кон.',        group: 'vacation' },
  { key: 'dismissalDate',  label: 'Дата увольнения',      group: 'dismissal' },
  { key: 'dismissalReason',label: 'Причина увольнения',   group: 'dismissal' },
];

const MAIN_FIELDS = FIELDS.filter(f => f.required);

function fieldFill(staffData: any | null): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const f of FIELDS) {
    const v = staffData?.[f.key];
    result[f.key] = Boolean(v && String(v).trim() !== '');
  }
  return result;
}

function countFilled(fill: Record<string, boolean>, keys: string[]): number {
  return keys.filter(k => fill[k]).length;
}

interface FillPosition {
  id: number;
  name: string;
  staffName: string | null;
  staffData: any | null;
}

interface FillStore {
  hid: number;
  name: string;
  lastFilledAt: string | null;
  positions: FillPosition[];
}

interface FillManager {
  hid: number;
  name: string;
  totalStores: number;
  filledStores: number;
  stores: FillStore[];
}

interface Props {
  onBack: () => void;
}

const fmt = (dt: string | null) => {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return dt; }
};

function PctBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={styles.pctBarWrap}>
      <div className={`${styles.pctBarFill} ${colorClass}`} style={{ width: `${pct}%` }} />
      <span className={styles.pctLabel}>{value}/{max}</span>
    </div>
  );
}

const ALL_KEYS = FIELDS.map(f => f.key);
const MAIN_KEYS = MAIN_FIELDS.map(f => f.key);

const StaffFillStats: React.FC<Props> = ({ onBack }) => {
  const [managers, setManagers] = useState<FillManager[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<number>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'main' | 'vacation' | 'dismissal'>('all');

  useEffect(() => {
    personalApi.getAdminManagerReport()
      .then(data => {
        if (data.status === 'success') {
          setManagers(data.managers);
          setGeneratedAt(data.generatedAt);
        } else {
          setError(data.message || 'Ошибка загрузки');
        }
      })
      .catch(() => setError('Ошибка загрузки данных'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (set: Set<number>, id: number): Set<number> => {
    const s = new Set(set); s.has(id) ? s.delete(id) : s.add(id); return s;
  };

  const visibleFields = groupFilter === 'all' ? FIELDS : FIELDS.filter(f => f.group === groupFilter);
  const visibleKeys = visibleFields.map(f => f.key);

  const filteredManagers = search
    ? managers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.stores.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
      )
    : managers;

  // Per-manager aggregate stats across all occupied positions, main fields only
  function managerStats(m: FillManager) {
    let totalSlots = 0, filledSlots = 0;
    for (const store of m.stores) {
      for (const pos of store.positions) {
        if (!pos.staffName) continue;
        const fill = fieldFill(pos.staffData);
        totalSlots += MAIN_KEYS.length;
        filledSlots += countFilled(fill, MAIN_KEYS);
      }
    }
    return { filledSlots, totalSlots };
  }

  function storeStats(store: FillStore) {
    let totalSlots = 0, filledSlots = 0;
    for (const pos of store.positions) {
      if (!pos.staffName) continue;
      const fill = fieldFill(pos.staffData);
      totalSlots += MAIN_KEYS.length;
      filledSlots += countFilled(fill, MAIN_KEYS);
    }
    return { filledSlots, totalSlots };
  }

  const exportExcel = () => {
    const rows: any[][] = [
      ['Управляющий', 'Адрес', 'Должность', 'Сотрудник', ...FIELDS.map(f => f.label), 'Осн. поля заполнены', 'Все поля заполнены'],
    ];

    for (const m of managers) {
      for (const store of m.stores) {
        for (const pos of store.positions) {
          const fill = fieldFill(pos.staffData);
          const mainFilled = countFilled(fill, MAIN_KEYS);
          const allFilled = countFilled(fill, ALL_KEYS);
          rows.push([
            m.name,
            store.name,
            pos.name,
            pos.staffName || 'Вакансия',
            ...FIELDS.map(f => (pos.staffData ? (fill[f.key] ? '+' : '—') : 'н/д')),
            pos.staffData ? `${mainFilled}/${MAIN_KEYS.length}` : '—',
            pos.staffData ? `${allFilled}/${ALL_KEYS.length}` : '—',
          ]);
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = [20, 28, 24, 28, ...FIELDS.map(() => ({ wch: 14 })), 18, 18];
    ws['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 24 }, { wch: 28 }, ...FIELDS.map(() => ({ wch: 14 })), { wch: 18 }, { wch: 18 }];
    void colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Заполненность полей');
    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    XLSX.writeFile(wb, `Заполненность_${dateStr}.xlsx`);
  };

  if (loading) return (
    <div className={styles.centered}><div className={styles.spinner} /><p>Загрузка...</p></div>
  );

  if (error) return (
    <div className={styles.centered}>
      <p className={styles.errorText}>{error}</p>
      <button className={styles.backBtn} onClick={onBack}><ArrowLeft size={16} /> Назад</button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} /><span>Назад</span>
        </button>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.groupTabs}>
          {(['all', 'main', 'vacation', 'dismissal'] as const).map(g => (
            <button
              key={g}
              className={`${styles.groupTab} ${groupFilter === g ? styles.activeTab : ''}`}
              onClick={() => setGroupFilter(g)}
            >
              {{ all: 'Все', main: 'Основные', vacation: 'Отпуска', dismissal: 'Увольнение' }[g]}
            </button>
          ))}
        </div>
        <button className={styles.exportBtn} onClick={exportExcel}>
          <Download size={16} /><span>Excel</span>
        </button>
      </div>

      {generatedAt && (
        <p className={styles.meta}>
          Сформировано: {fmt(generatedAt)} · {managers.length} управляющих · поля: {visibleFields.map(f => f.label).join(', ')}
        </p>
      )}

      <div className={styles.legend}>
        <span className={styles.legendFilled}>заполнено</span>
        <span className={styles.legendEmpty}>пусто</span>
        <span className={styles.legendVacant}>вакансия</span>
      </div>

      <div className={styles.list}>
        {filteredManagers.length === 0 && <div className={styles.empty}>Ничего не найдено</div>}

        {filteredManagers.map(manager => {
          const isOpen = expandedManagers.has(manager.hid);
          const { filledSlots, totalSlots } = managerStats(manager);
          const pct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

          return (
            <div key={manager.hid} className={styles.managerBlock}>
              <button className={styles.managerHeader} onClick={() => setExpandedManagers(prev => toggle(prev, manager.hid))}>
                <div className={styles.managerLeft}>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className={styles.managerName}>{manager.name}</span>
                </div>
                <div className={styles.managerRight}>
                  <span className={styles.managerStat}>осн. поля: {filledSlots}/{totalSlots} ({pct}%)</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className={styles.storeList}>
                  {manager.stores.map(store => {
                    const storeOpen = expandedStores.has(store.hid);
                    const ss = storeStats(store);
                    const occupiedCount = store.positions.filter(p => p.staffName).length;

                    return (
                      <div key={store.hid} className={styles.storeBlock}>
                        <button className={styles.storeRow} onClick={() => setExpandedStores(prev => toggle(prev, store.hid))}>
                          <div className={styles.storeLeft}>
                            {storeOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            <span className={styles.storeName}>{store.name}</span>
                          </div>
                          <div className={styles.storeRight}>
                            <span className={styles.storeDate}>{fmt(store.lastFilledAt)}</span>
                            <span className={styles.storeStat}>{occupiedCount} чел.</span>
                            {ss.totalSlots > 0 && (
                              <PctBar
                                value={ss.filledSlots}
                                max={ss.totalSlots}
                                colorClass={styles.barBlue}
                              />
                            )}
                          </div>
                        </button>

                        {storeOpen && (
                          <div className={styles.positionList}>
                            {store.positions.map(pos => {
                              const posOpen = expandedPositions.has(pos.id);
                              const fill = fieldFill(pos.staffData);
                              const mainFilled = pos.staffData ? countFilled(fill, MAIN_KEYS) : 0;
                              const visFilled = pos.staffData ? countFilled(fill, visibleKeys) : 0;

                              return (
                                <div key={pos.id} className={styles.posBlock}>
                                  <button
                                    className={styles.posRow}
                                    onClick={() => pos.staffName && setExpandedPositions(prev => toggle(prev, pos.id))}
                                    disabled={!pos.staffName}
                                  >
                                    <div className={styles.posLeft}>
                                      {pos.staffName && (posOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                                      {!pos.staffName && <span className={styles.chevronPlaceholder} />}
                                      <span className={styles.posName}>{pos.name}</span>
                                    </div>
                                    <div className={styles.posRight}>
                                      {!pos.staffName && (
                                        <span className={styles.vacantBadge}>Вакансия</span>
                                      )}
                                      {pos.staffName && !pos.staffData && (
                                        <span className={styles.posStaff}>{pos.staffName}</span>
                                      )}
                                      {pos.staffName && pos.staffData && (
                                        <>
                                          <span className={styles.posStaff}>{pos.staffName}</span>
                                          <PctBar
                                            value={mainFilled}
                                            max={MAIN_KEYS.length}
                                            colorClass={mainFilled < MAIN_KEYS.length ? styles.barOrange : styles.barGreen}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </button>

                                  {posOpen && pos.staffData && (
                                    <div className={styles.fieldGrid}>
                                      <div className={styles.fieldGridSub}>
                                        <span className={styles.fieldSubLabel}>
                                          Видимые поля: {visFilled}/{visibleKeys.length} · Осн.: {mainFilled}/{MAIN_KEYS.length}
                                        </span>
                                      </div>
                                      <div className={styles.fieldCells}>
                                        {visibleFields.map(f => (
                                          <div
                                            key={f.key}
                                            className={`${styles.fieldCell} ${fill[f.key] ? styles.cellFilled : f.required ? styles.cellRequired : styles.cellEmpty}`}
                                            title={fill[f.key] ? String(pos.staffData[f.key]) : f.required ? 'обязательное — не заполнено' : 'не заполнено'}
                                          >
                                            <span className={styles.fieldCellLabel}>{f.label}</span>
                                            <span className={styles.fieldCellValue}>
                                              {fill[f.key] ? String(pos.staffData[f.key]) : '—'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffFillStats;
