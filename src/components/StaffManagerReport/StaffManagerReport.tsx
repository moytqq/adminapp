'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { personalApi } from '@/services/personalApi';
import { ArrowLeft, ChevronDown, ChevronRight, Download, Search } from 'lucide-react';
import styles from './StaffManagerReport.module.scss';

interface ReportPosition {
  id: number;
  name: string;
  staffName: string | null;
}

interface ReportStore {
  hid: number;
  name: string;
  lastFilledAt: string | null;
  positions: ReportPosition[];
}

interface ReportManager {
  hid: number;
  name: string;
  totalStores: number;
  filledStores: number;
  stores: ReportStore[];
}

interface Props {
  onBack: () => void;
}

const fmt = (dt: string | null) => {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return dt; }
};

const StaffManagerReport: React.FC<Props> = ({ onBack }) => {
  const [managers, setManagers] = useState<ReportManager[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<number>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

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

  const toggleManager = (hid: number) => setExpandedManagers(prev => {
    const s = new Set(prev); s.has(hid) ? s.delete(hid) : s.add(hid); return s;
  });

  const toggleStore = (hid: number) => setExpandedStores(prev => {
    const s = new Set(prev); s.has(hid) ? s.delete(hid) : s.add(hid); return s;
  });

  const filteredManagers = search
    ? managers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.stores.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
      )
    : managers;

  const exportExcel = () => {
    const rows: any[][] = [
      ['Управляющий', 'Адрес', 'Последнее заполнение', 'Должность', 'Сотрудник'],
    ];

    for (const m of managers) {
      if (m.stores.length === 0) {
        rows.push([m.name, '—', '—', '—', '—']);
        continue;
      }
      for (const store of m.stores) {
        if (store.positions.length === 0) {
          rows.push([m.name, store.name, fmt(store.lastFilledAt), '—', '—']);
          continue;
        }
        for (const pos of store.positions) {
          rows.push([
            m.name,
            store.name,
            fmt(store.lastFilledAt),
            pos.name,
            pos.staffName || 'Вакансия',
          ]);
        }
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 28 },
      { wch: 32 },
      { wch: 22 },
      { wch: 28 },
      { wch: 30 },
    ];

    // Bold header
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'F2F4F7' } } };
    ['A1', 'B1', 'C1', 'D1', 'E1'].forEach(cell => {
      if (ws[cell]) ws[cell].s = headerStyle;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по персоналу');

    const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    XLSX.writeFile(wb, `Отчёт_управляющие_${dateStr}.xlsx`);
  };

  if (loading) return (
    <div className={styles.centered}>
      <div className={styles.spinner} />
      <p>Загрузка отчёта...</p>
    </div>
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
            placeholder="Поиск по управляющему или адресу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.exportBtn} onClick={exportExcel}>
          <Download size={16} /><span>Excel</span>
        </button>
      </div>

      {generatedAt && (
        <p className={styles.meta}>
          Сформировано: {fmt(generatedAt)} · {managers.length} управляющих
        </p>
      )}

      <div className={styles.list}>
        {filteredManagers.length === 0 && (
          <div className={styles.empty}>Ничего не найдено</div>
        )}

        {filteredManagers.map(manager => {
          const isOpen = expandedManagers.has(manager.hid);
          const pct = manager.totalStores > 0
            ? Math.round((manager.filledStores / manager.totalStores) * 100)
            : 0;

          return (
            <div key={manager.hid} className={styles.managerBlock}>
              <button className={styles.managerHeader} onClick={() => toggleManager(manager.hid)}>
                <div className={styles.managerLeft}>
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className={styles.managerName}>{manager.name}</span>
                </div>
                <div className={styles.managerRight}>
                  <span className={styles.managerStat}>
                    {manager.filledStores}/{manager.totalStores} адресов
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className={styles.storeList}>
                  {manager.stores.length === 0 && (
                    <p className={styles.noStores}>Нет привязанных адресов</p>
                  )}
                  {manager.stores.map(store => {
                    const storeOpen = expandedStores.has(store.hid);
                    const occupied = store.positions.filter(p => p.staffName).length;
                    const fresh = store.lastFilledAt
                      ? (Date.now() - new Date(store.lastFilledAt).getTime()) < 7 * 86400_000
                      : false;

                    return (
                      <div key={store.hid} className={styles.storeBlock}>
                        <button
                          className={styles.storeRow}
                          onClick={() => toggleStore(store.hid)}
                        >
                          <div className={styles.storeLeft}>
                            {storeOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            <span className={styles.storeName}>{store.name}</span>
                          </div>
                          <div className={styles.storeRight}>
                            <span className={styles.occupancy}>
                              {occupied}/{store.positions.length}
                            </span>
                            <span className={`${styles.fillDate} ${fresh ? styles.fresh : store.lastFilledAt ? styles.stale : styles.never}`}>
                              {store.lastFilledAt ? fmt(store.lastFilledAt) : 'не заполнялся'}
                            </span>
                          </div>
                        </button>

                        {storeOpen && (
                          <div className={styles.positionList}>
                            {store.positions.map(pos => (
                              <div key={pos.id} className={styles.posRow}>
                                <span className={styles.posName}>{pos.name}</span>
                                <span className={`${styles.posStaff} ${!pos.staffName ? styles.vacant : ''}`}>
                                  {pos.staffName || 'Вакансия'}
                                </span>
                              </div>
                            ))}
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

export default StaffManagerReport;
