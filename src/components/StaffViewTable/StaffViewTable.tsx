'use client';

import React, { useEffect, useState } from 'react';
import { personalApi } from '@/services/personalApi';
import styles from './StaffViewTable.module.scss';
import { ArrowLeft, ChevronDown, ChevronRight, Search, User } from 'lucide-react';

interface StaffInfo {
  birthDate?: string | null;
  citizenship?: string | null;
  contractType?: string | null;
  children?: string | null;
  vacation1Start?: string | null;
  vacation1End?: string | null;
  vacation2Start?: string | null;
  vacation2End?: string | null;
  vacation3Start?: string | null;
  vacation3End?: string | null;
  phone?: string | null;
  startDate?: string | null;
  dismissalDate?: string | null;
  dismissalReason?: string | null;
}

interface ViewPosition {
  id: number;
  name: string;
  staffName: string | null;
  staffInfo: StaffInfo | null;
}

interface ViewStore {
  hid: number;
  name: string;
  lastFilledAt: string | null;
  positions: ViewPosition[];
}

const contractTypeLabel = (val: string | null | undefined) => {
  if (!val) return null;
  if (val === 'employment') return 'Трудовой договор';
  if (val === 'gph') return 'ГПХ';
  if (val === 'patent') return 'Патент';
  return val;
};

const formatDate = (val: string | null | undefined) => {
  if (!val) return null;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) return val;
  try {
    return new Date(val).toLocaleDateString('ru-RU');
  } catch {
    return val;
  }
};

interface Props {
  onBack: () => void;
}

const StaffViewTable: React.FC<Props> = ({ onBack }) => {
  const [stores, setStores] = useState<ViewStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStores, setExpandedStores] = useState<Set<number>>(new Set());
  const [expandedStaff, setExpandedStaff] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    personalApi.getViewStores()
      .then(data => {
        if (data.status === 'success') {
          setStores(data.stores);
        } else {
          setError(data.message || 'Ошибка загрузки');
        }
      })
      .catch(() => setError('Ошибка загрузки данных'))
      .finally(() => setLoading(false));
  }, []);

  const toggleStore = (hid: number) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      next.has(hid) ? next.delete(hid) : next.add(hid);
      return next;
    });
  };

  const toggleStaff = (posId: number) => {
    setExpandedStaff(prev => {
      const next = new Set(prev);
      next.has(posId) ? next.delete(posId) : next.add(posId);
      return next;
    });
  };

  const filteredStores = search
    ? stores.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    : stores;

  const renderInfoRow = (label: string, value: string | null | undefined) => {
    if (!value) return null;
    return (
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>{label}:</span>
        <span className={styles.infoValue}>{value}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={onBack} className={styles.backBtn}>
          <ArrowLeft size={18} /> Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск по адресу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.storeList}>
        {filteredStores.length === 0 && (
          <div className={styles.empty}>Ничего не найдено</div>
        )}
        {filteredStores.map(store => {
          const isStoreOpen = expandedStores.has(store.hid);
          const occupied = store.positions.filter(p => p.staffName).length;
          const total = store.positions.length;

          return (
            <div key={store.hid} className={styles.storeBlock}>
              <button
                className={styles.storeHeader}
                onClick={() => toggleStore(store.hid)}
              >
                <div className={styles.storeLeft}>
                  {isStoreOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className={styles.storeName}>{store.name}</span>
                </div>
                <div className={styles.storeRight}>
                  <span className={styles.storeStat}>{occupied}/{total}</span>
                  {store.lastFilledAt && (
                    <span className={styles.storeDate}>
                      {formatDate(store.lastFilledAt)}
                    </span>
                  )}
                </div>
              </button>

              {isStoreOpen && (
                <div className={styles.positionList}>
                  {store.positions.map(pos => {
                    const isStaffOpen = expandedStaff.has(pos.id);
                    const hasDetails = pos.staffInfo && Object.values(pos.staffInfo).some(v => !!v);
                    const isVacant = !pos.staffName;

                    return (
                      <div key={pos.id} className={styles.posBlock}>
                        <div
                          className={`${styles.posRow} ${isVacant ? styles.vacant : ''} ${hasDetails ? styles.clickable : ''}`}
                          onClick={() => hasDetails && toggleStaff(pos.id)}
                        >
                          <div className={styles.posLeft}>
                            {hasDetails && (
                              isStaffOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            )}
                            {!hasDetails && <span className={styles.posIndent} />}
                            <User size={14} className={isVacant ? styles.vacantIcon : styles.staffIcon} />
                            <span className={styles.posName}>{pos.name}</span>
                          </div>
                          <span className={`${styles.staffName} ${isVacant ? styles.vacantText : ''}`}>
                            {pos.staffName || 'Вакансия'}
                          </span>
                        </div>

                        {isStaffOpen && hasDetails && (
                          <div className={styles.staffDetails}>
                            {renderInfoRow('Дата рождения', formatDate(pos.staffInfo!.birthDate))}
                            {renderInfoRow('Гражданство', pos.staffInfo!.citizenship)}
                            {renderInfoRow('Договор', contractTypeLabel(pos.staffInfo!.contractType))}
                            {renderInfoRow('Дети', pos.staffInfo!.children)}
                            {renderInfoRow('Телефон', pos.staffInfo!.phone)}
                            {renderInfoRow('Дата начала работы', formatDate(pos.staffInfo!.startDate))}
                            {([1, 2, 3] as const).map(n => {
                              const s = pos.staffInfo![`vacation${n}Start` as keyof StaffInfo];
                              const e = pos.staffInfo![`vacation${n}End` as keyof StaffInfo];
                              if (!s && !e) return null;
                              return (
                                <React.Fragment key={n}>
                                  {renderInfoRow(`Отпуск ${n} с`, formatDate(s))}
                                  {renderInfoRow(`Отпуск ${n} по`, formatDate(e))}
                                </React.Fragment>
                              );
                            })}
                            {renderInfoRow('Дата увольнения', formatDate(pos.staffInfo!.dismissalDate))}
                            {renderInfoRow('Причина увольнения', pos.staffInfo!.dismissalReason)}
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

export default StaffViewTable;
