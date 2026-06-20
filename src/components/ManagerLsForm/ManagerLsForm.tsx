'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks/hooks';
import { personalApi } from '@/services/personalApi';
import { X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import StaffPicker from './StaffPicker';
import MaskedDateInput from '@/components/MaskedDateInput/MaskedDateInput';
import styles from './ManagerLsForm.module.scss';

interface StaffInfoFields {
  fio: string;
  birthDate: string;
  citizenship: string;
  contractType: string;
  children: string;
  vacation1Start: string;
  vacation1End: string;
  vacation2Start: string;
  vacation2End: string;
  vacation3Start: string;
  vacation3End: string;
  phone: string;
  startDate: string;
  dismissalDate: string;
  dismissalReason: string;
}

interface PositionItem {
  id?: number;
  name: string;
  lsid: string | null;
  isNew: boolean;
  isDeleted: boolean;
  staffForm: StaffInfoFields | null;
  staffInfoLoaded: boolean;
}

interface StoreData {
  hid: number;
  name: string;
  lastFilledAt: string | null;
  filledToday: boolean;
  positions: Array<{
    id: number;
    name: string;
    hid: number;
    lsid: string | null;
    staff: { lsid: string; fio: string } | null;
    staffInfo: Array<{ label: string; value: string }>;
    reportStaff: Partial<StaffInfoFields> | null;
  }>;
}

interface ManagerLsFormProps {
  onClose: () => void;
}

const CONTRACT_TYPES = [
  { value: '', label: 'Не указано' },
  { value: 'employment', label: 'Трудовой договор' },
  { value: 'gph', label: 'ГПХ' },
  { value: 'patent', label: 'Патент' },
];

// Stored label values must match backend LABEL_MAP exactly (typos are intentional for existing data)
const INFO_LABEL_MAP: Record<string, string> = {
  birthDate: 'Дата ррождения',
  citizenship: 'Ггражданство',
  contractType: 'Ттип отношений',
  children: 'Дети',
  vacation1Start: 'Начало отпуска 1',
  vacation1End: 'Конец отпуска 1',
  vacation2Start: 'Начало отпуска 2',
  vacation2End: 'Конец отпуска 2',
  vacation3Start: 'Начало отпуска 3',
  vacation3End: 'Конец отпуска 3',
  phone: 'Телефон',
  startDate: 'Дата начала работы',
  dismissalDate: 'Дата увольнения',
  dismissalReason: 'Причина увольнения',
};

const emptyStaffForm = (): StaffInfoFields => ({
  fio: '',
  birthDate: '',
  citizenship: '',
  contractType: '',
  children: '',
  vacation1Start: '',
  vacation1End: '',
  vacation2Start: '',
  vacation2End: '',
  vacation3Start: '',
  vacation3End: '',
  phone: '',
  startDate: '',
  dismissalDate: '',
  dismissalReason: '',
});

const buildStaffForm = (
  staffData: { fio: string } | null,
  infoRecords: Array<{ label: string; value: string }>,
): StaffInfoFields => {
  const form = emptyStaffForm();
  if (staffData) {
    form.fio = staffData.fio || '';
  }
  const revMap: Record<string, keyof StaffInfoFields> = Object.fromEntries(
    Object.entries(INFO_LABEL_MAP).map(([k, v]) => [v, k as keyof StaffInfoFields]),
  );
  infoRecords.forEach(rec => {
    const key = revMap[rec.label];
    if (key) (form as any)[key] = rec.value;
  });
  return form;
};

const buildStaffFormFromReport = (reportStaff: Partial<StaffInfoFields> & Record<string, any>): StaffInfoFields => ({
  fio: reportStaff.fio || '',
  birthDate: reportStaff.birthDate || '',
  citizenship: reportStaff.citizenship || '',
  contractType: reportStaff.contractType || '',
  children: reportStaff.children || '',
  vacation1Start: reportStaff.vacation1Start || reportStaff.vacationStart || '',
  vacation1End: reportStaff.vacation1End || reportStaff.vacationEnd || '',
  vacation2Start: reportStaff.vacation2Start || '',
  vacation2End: reportStaff.vacation2End || '',
  vacation3Start: reportStaff.vacation3Start || '',
  vacation3End: reportStaff.vacation3End || '',
  phone: reportStaff.phone || '',
  startDate: reportStaff.startDate || '',
  dismissalDate: reportStaff.dismissalDate || reportStaff.departureDate || '',
  dismissalReason: reportStaff.dismissalReason || '',
});

const ManagerLsForm: React.FC<ManagerLsFormProps> = ({ onClose }) => {
  const { staff: allStaff } = useAppSelector(state => state.personal);

  const [stores, setStores] = useState<StoreData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [totalFilledToday, setTotalFilledToday] = useState(0);
  const [totalStores, setTotalStores] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const initPositions = useCallback((store: StoreData): PositionItem[] =>
    store.positions.map(p => ({
      id: p.id,
      name: p.name,
      lsid: p.lsid,
      isNew: false,
      isDeleted: false,
      staffForm: p.lsid
        ? (p.reportStaff
            ? buildStaffFormFromReport(p.reportStaff)
            : (p.staff ? buildStaffForm(p.staff, p.staffInfo) : null))
        : null,
      staffInfoLoaded: true,
    })),
  []);

  useEffect(() => {
    (async () => {
      try {
        const result = await personalApi.getManagerStores();
        if (result.status !== 'success') {
          setError(result.message || 'Ошибка загрузки');
          setLoading(false);
          return;
        }
        setTotalFilledToday(result.totalFilledToday || 0);
        setTotalStores(result.totalStores || 0);
        if (!result.stores || result.stores.length === 0) {
          setDone(true);
          setLoading(false);
          return;
        }
        setStores(result.stores);
        const firstUnfilled = result.stores.findIndex((s: StoreData) => !s.filledToday);
        if (firstUnfilled === -1) {
          setDone(true);
          setLoading(false);
          return;
        }
        setCurrentIndex(firstUnfilled);
        setPositions(initPositions(result.stores[firstUnfilled]));
      } catch {
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    })();
  }, [initPositions]);

  const currentStore = stores[currentIndex];

  const updatePosition = (idx: number, updates: Partial<PositionItem>) => {
    setPositions(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const handleStaffSelect = async (posIdx: number, lsid: string | null) => {
    if (!lsid) {
      updatePosition(posIdx, { lsid: null, staffForm: null, staffInfoLoaded: true });
      return;
    }
    const staffMember = allStaff.find(s => s.lsid === lsid);
    updatePosition(posIdx, { lsid, staffInfoLoaded: false });
    try {
      const infoRecords = await personalApi.getInfo(lsid);
      const staffForm = buildStaffForm(
        staffMember ? { fio: staffMember.fio } : null,
        infoRecords,
      );
      updatePosition(posIdx, { staffForm, staffInfoLoaded: true });
    } catch {
      updatePosition(posIdx, { staffForm: emptyStaffForm(), staffInfoLoaded: true });
    }
  };

  const handleStaffFormChange = (
    posIdx: number,
    field: keyof StaffInfoFields,
    value: string,
  ) => {
    setPositions(prev => prev.map((p, i) => {
      if (i !== posIdx) return p;
      return { ...p, staffForm: { ...(p.staffForm || emptyStaffForm()), [field]: value } };
    }));
  };

  const addPosition = () => {
    setPositions(prev => [...prev, {
      name: '',
      lsid: null,
      isNew: true,
      isDeleted: false,
      staffForm: null,
      staffInfoLoaded: true,
    }]);
  };

  const deletePosition = (idx: number) => {
    setPositions(prev => prev.map((p, i) =>
      i === idx ? { ...p, isDeleted: true, expanded: false } : p,
    ));
  };

  const handleSave = async () => {
    if (!currentStore) return;
    setSaving(true);
    setError(null);

    for (const pos of positions) {
      if (!pos.isDeleted && pos.lsid && pos.staffForm) {
        for (const n of [1, 2, 3] as const) {
          const start = pos.staffForm[`vacation${n}Start` as keyof StaffInfoFields];
          const end = pos.staffForm[`vacation${n}End` as keyof StaffInfoFields];
          if (start && end) {
            const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
            if (diff < 0) {
              setError(`«${pos.name}»: конец отпуска ${n} раньше начала`);
              setSaving(false);
              return;
            }
          }
        }
      }
    }

    try {
      const payload = positions.map(p => ({
        id: p.id,
        name: p.name,
        delete: p.isDeleted,
        lsid: p.lsid,
        staff: p.lsid && p.staffForm ? p.staffForm : null,
      }));
      const result = await personalApi.saveManagerStore(currentStore.hid, payload);
      if (result.status !== 'success') {
        setError(result.message || 'Ошибка сохранения');
        return;
      }
      const updatedStores = stores.map((s, i) =>
        i === currentIndex ? { ...s, filledToday: true } : s,
      );
      setStores(updatedStores);
      setTotalFilledToday(prev => prev + 1);
      const nextIndex = updatedStores.findIndex((s, i) => i > currentIndex && !s.filledToday);
      if (nextIndex === -1) {
        const anyUnfilled = updatedStores.findIndex(s => !s.filledToday);
        if (anyUnfilled === -1) {
          setDone(true);
        } else {
          setCurrentIndex(anyUnfilled);
          setPositions(initPositions(updatedStores[anyUnfilled]));
          bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setCurrentIndex(nextIndex);
        setPositions(initPositions(updatedStores[nextIndex]));
        bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreJump = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setPositions(initPositions(stores[index]));
    setError(null);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activePositions = positions.filter(p => !p.isDeleted);
  const isLastUnfilled = !stores.some((s, i) => i !== currentIndex && !s.filledToday);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <h2>Заполнение персонала</h2>
            {!loading && !done && currentStore && (() => {
              const unfilledCount = stores.filter(s => !s.filledToday).length;
              return (
                <span className={styles.progress}>
                  {unfilledCount > 0 ? `${unfilledCount} из ${stores.length}` : `${stores.length} / ${stores.length}`}
                </span>
              );
            })()}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <div className={styles.body} ref={bodyRef}>
          {loading && (
            <div className={styles.centered}>
              <Loader2 size={32} className={styles.spinner} />
              <p>Загрузка...</p>
            </div>
          )}

          {!loading && done && (
            <div className={styles.centered}>
              <Check size={48} className={styles.doneIcon} />
              <p className={styles.doneText}>
                Все адреса заполнены сегодня
              </p>
              <p className={styles.doneSubtext}>
                Заполнено сегодня: {totalFilledToday} из {totalStores}
              </p>
              <div className={styles.doneActions}>
                {stores.length > 0 && (
                  <button
                    className={styles.viewButton}
                    onClick={() => {
                      setDone(false);
                      const idx = stores.length > 0 ? 0 : 0;
                      setCurrentIndex(idx);
                      setPositions(initPositions(stores[idx]));
                    }}
                  >
                    Просмотреть адреса
                  </button>
                )}
                <button className={styles.closeButton} onClick={onClose}>
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {!loading && !done && currentStore && (
            <>
              <div className={styles.storeInfo}>
                <select
                  className={styles.storeSelect}
                  value={currentIndex}
                  onChange={e => handleStoreJump(Number(e.target.value))}
                >
                  {stores.map((store, i) => {
                    let suffix = '';
                    if (store.filledToday) suffix = ' ✓';
                    else if (store.lastFilledAt) {
                      suffix = ' · ' + new Date(store.lastFilledAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
                    } else {
                      suffix = ' · не заполнялся';
                    }
                    return (
                      <option key={store.hid} value={i}>
                        {store.name}{suffix}
                      </option>
                    );
                  })}
                </select>
                {currentStore.lastFilledAt && (
                  <span className={styles.lastFilled}>
                    Последнее заполнение:{' '}
                    {new Date(currentStore.lastFilledAt).toLocaleDateString('ru', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {!currentStore.lastFilledAt && (
                  <span className={styles.neverFilled}>Ещё не заполнялся</span>
                )}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.positions}>
                {activePositions.length === 0 && (
                  <p className={styles.noPositions}>Нет вакансий. Добавьте первую.</p>
                )}

                {positions.map((pos, idx) => {
                  if (pos.isDeleted) return null;
                  return (
                    <div key={idx} className={styles.positionCard}>
                      <div className={styles.positionRow}>
                        <input
                          className={styles.positionName}
                          value={pos.name}
                          onChange={e => updatePosition(idx, { name: e.target.value })}
                          placeholder="Название должности"
                        />

                        <StaffPicker
                          allStaff={allStaff}
                          value={pos.lsid}
                          onChange={lsid => handleStaffSelect(idx, lsid)}
                          loading={!pos.staffInfoLoaded}
                        />

                        <button
                          className={styles.deleteBtn}
                          onClick={() => deletePosition(idx)}
                          aria-label="Удалить вакансию"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {pos.lsid && (
                        <div className={styles.staffFields}>
                          {!pos.staffInfoLoaded ? (
                            <Loader2 size={20} className={styles.spinner} />
                          ) : (
                            <div className={styles.fieldsGrid}>
                              <label className={styles.field}>
                                <span>ФИО</span>
                                <input
                                  value={pos.staffForm?.fio || ''}
                                  onChange={e => handleStaffFormChange(idx, 'fio', e.target.value)}
                                  placeholder="ФИО"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Гражданство</span>
                                <input
                                  value={pos.staffForm?.citizenship || ''}
                                  onChange={e => handleStaffFormChange(idx, 'citizenship', e.target.value)}
                                  placeholder="Гражданство"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Дата рождения</span>
                                <MaskedDateInput
                                  value={pos.staffForm?.birthDate || ''}
                                  onChange={v => handleStaffFormChange(idx, 'birthDate', v)}
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Договор</span>
                                <select
                                  value={pos.staffForm?.contractType || ''}
                                  onChange={e => handleStaffFormChange(idx, 'contractType', e.target.value)}
                                >
                                  {CONTRACT_TYPES.map(ct => (
                                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                                  ))}
                                </select>
                              </label>
                              <label className={styles.field}>
                                <span>Дети</span>
                                <input
                                  value={pos.staffForm?.children || ''}
                                  onChange={e => handleStaffFormChange(idx, 'children', e.target.value)}
                                  placeholder="Количество или описание"
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Телефон</span>
                                <input
                                  type="tel"
                                  value={pos.staffForm?.phone || ''}
                                  onChange={e => handleStaffFormChange(idx, 'phone', e.target.value)}
                                  placeholder="+7..."
                                />
                              </label>
                              <label className={styles.field}>
                                <span>Дата начала работы</span>
                                <MaskedDateInput
                                  value={pos.staffForm?.startDate || ''}
                                  onChange={v => handleStaffFormChange(idx, 'startDate', v)}
                                />
                              </label>
                              {([1, 2, 3] as const).map(n => (
                                <React.Fragment key={n}>
                                  <label className={styles.field}>
                                    <span>Начало отпуска {n}</span>
                                    <MaskedDateInput
                                      value={pos.staffForm?.[`vacation${n}Start`] || ''}
                                      onChange={v => handleStaffFormChange(idx, `vacation${n}Start` as keyof StaffInfoFields, v)}
                                        />
                                  </label>
                                  <label className={styles.field}>
                                    <span>Конец отпуска {n}</span>
                                    <MaskedDateInput
                                      value={pos.staffForm?.[`vacation${n}End`] || ''}
                                      onChange={v => handleStaffFormChange(idx, `vacation${n}End` as keyof StaffInfoFields, v)}
                                        />
                                  </label>
                                </React.Fragment>
                              ))}
                              <label className={styles.field}>
                                <span>Дата увольнения (если известно)</span>
                                <MaskedDateInput
                                  value={pos.staffForm?.dismissalDate || ''}
                                  onChange={v => handleStaffFormChange(idx, 'dismissalDate', v)}
                                />
                              </label>
                              <label className={`${styles.field} ${styles.fieldFullWidth}`}>
                                <span>Причина увольнения</span>
                                <input
                                  value={pos.staffForm?.dismissalReason || ''}
                                  onChange={e => handleStaffFormChange(idx, 'dismissalReason', e.target.value)}
                                  placeholder="Причина"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className={styles.addPositionBtn} onClick={addPosition}>
                <Plus size={16} />
                <span>Добавить вакансию</span>
              </button>
              <div style={{ height: 200 }} />
            </>
          )}
        </div>

        {!loading && !done && currentStore && (
          <div className={styles.footer}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
              <span>{isLastUnfilled ? 'Сохранить и завершить' : 'Сохранить и продолжить'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerLsForm;
